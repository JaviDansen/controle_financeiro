import { RequestHandler } from 'express'
import { createHash } from 'crypto'
import { join, extname } from 'path'
import { readdir, stat } from 'fs/promises'
import { createReadStream, existsSync } from 'fs'
import { z } from 'zod'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { db, importImages, importSessions, importExtractedTransactions, transactions } from '@finapp/db'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'
import { logRequestEvent } from '../middlewares/request-logger.middleware'
import { saveUploadedFile } from '../services/file-storage.service'
import { extractFromImage } from '../services/gemini/gemini.service'
import { TransacaoExtraida } from '../services/gemini/types'

const DATA_IMPORT_IMAGES_ROOT = join(__dirname, '../../data_import/images')

const API_ROOT = join(__dirname, '../../')

const SUPPORTED_BANKS = ['mercadopago'] as const
const SUPPORTED_FORMATS = ['screenshot', 'csv', 'pdf', 'xls', 'xlsx'] as const

const importSchema = z.object({
  imageId: z.string().uuid().optional(), // se fornecido, reutiliza imagem jÃ¡ validada
  bank: z.enum(SUPPORTED_BANKS),
  format: z.enum(SUPPORTED_FORMATS).default('screenshot'),
  fileBase64: z.string().min(1).optional(),
  imageBase64: z.string().min(1).optional(),
  fileName: z.string().trim().min(1).max(255).optional(),
  mimeType: z.string().trim().min(1).max(255).optional(),
  referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sessionToken: z.string().min(1).max(64).optional(),
  ignoreKeywords: z.string().max(500).optional(),
}).refine((data) => Boolean(data.imageId ?? data.fileBase64 ?? data.imageBase64), {
  message: 'Arquivo ou imageId Ã© obrigatÃ³rio',
  path: ['fileBase64'],
})

export const importExtract: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId

  const rawBody = req.body ?? {}
  logRequestEvent(req, 'import.received', {
    userId,
    body_keys: Object.keys(rawBody),
    bank: rawBody.bank,
    format: rawBody.format,
    fileName: rawBody.fileName,
    mimeType: rawBody.mimeType,
    fileBase64_len: typeof rawBody.fileBase64 === 'string' ? rawBody.fileBase64.length : undefined,
    imageBase64_len: typeof rawBody.imageBase64 === 'string' ? rawBody.imageBase64.length : undefined,
  })

  const parsed = importSchema.safeParse(rawBody)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { imageId: existingImageId, bank, format, fileBase64, imageBase64, fileName, mimeType, referenceDate, sessionToken, ignoreKeywords } = parsed.data

  let image: typeof importImages.$inferSelect

  if (existingImageId) {
    // Reutiliza imagem jÃ¡ salva e validada pelo /validate
    const [found] = await db
      .select()
      .from(importImages)
      .where(and(eq(importImages.id, existingImageId), eq(importImages.userId, userId)))

    if (!found?.filePath) {
      res.status(404).json({ error: 'Imagem nÃ£o encontrada ou sem arquivo' })
      return
    }
    image = found
  } else {
    const uploadBase64 = (fileBase64 ?? imageBase64)!
    const imageHash = createHash('sha256').update(uploadBase64).digest('hex')

    const [existing] = await db
      .select({ id: importImages.id })
      .from(importImages)
      .where(and(eq(importImages.userId, userId), eq(importImages.imageHash, imageHash)))

    if (existing) {
      logRequestEvent(req, 'import.duplicate', { userId, imageHash: imageHash.slice(0, 8) })
      res.status(409).json({ error: 'Arquivo ja processado anteriormente', imageId: existing.id })
      return
    }

    const [inserted] = await db
      .insert(importImages)
      .values({ userId, imageHash, bank, format, status: 'pending' })
      .returning()

    const filePath = await saveUploadedFile({ userId, imageId: inserted.id, format, mimeType, base64: uploadBase64 })
    await db.update(importImages).set({ filePath }).where(eq(importImages.id, inserted.id))
    await db.insert(importSessions).values({ userId, imageId: inserted.id, sessionToken: sessionToken ?? inserted.id, ignoreKeywords: ignoreKeywords ?? undefined, extractedCount: 0, confirmedCount: 0 })
    logRequestEvent(req, 'import.file_saved', { userId, imageId: inserted.id, filePath })

    image = { ...inserted, filePath }
  }

  // ExtraÃ§Ã£o via Gemini
  let transactions: TransacaoExtraida[] = []
  try {
    const keywordsArray = ignoreKeywords
      ? ignoreKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
      : undefined

    const extraction = await extractFromImage({
      filePath: image.filePath!,
      bank: image.bank as 'mercadopago',
      format: image.format as any,
      referenceDate,
      ignoreKeywords: keywordsArray,
    })
    transactions = extraction.transactions as TransacaoExtraida[]
    const { usage } = extraction

    // Persiste tokens e custo na imagem
    await db.update(importImages).set({
      status: 'processed',
      tokensPrompt: usage.tokensPrompt,
      tokensOutput: usage.tokensOutput,
      tokensTotal: usage.tokensTotal,
      costBrl: usage.costBrl,
    }).where(eq(importImages.id, image.id))

    // Persiste transaÃ§Ãµes extraÃ­das
    let insertedRows: { id: string }[] = []
    if (transactions.length > 0) {
      insertedRows = await db.insert(importExtractedTransactions).values(
        transactions.map((t) => ({
          imageId: image.id,
          userId,
          title: t.title,
          description: t.description,
          amount: String(t.amount),
          type: t.type,
          date: t.date,
          time: t.time,
          paymentMethod: t.payment_method,
          dateInferred: t.date_inferred,
          skipped: t.skipped,
          skipReason: t.skip_reason,
          status: 'pending' as const,
        }))
      ).returning({ id: importExtractedTransactions.id })
    }

    await db.update(importSessions)
      .set({ extractedCount: transactions.length })
      .where(eq(importSessions.imageId, image.id))

    logRequestEvent(req, 'import.extracted', {
      userId,
      imageId: image.id,
      count: transactions.length,
      tokensTotal: usage.tokensTotal,
      costBrl: usage.costBrl,
    })

    // Inclui o extractedId de cada transação para uso no confirm
    const transactionsWithId = transactions.map((t, idx) => ({
      ...t,
      extractedId: insertedRows[idx]?.id ?? null,
    }))

  res.status(201).json({
    data: {
      imageId: image.id,
      bank: image.bank,
      format: image.format,
      transactions: transactionsWithId,
    },
  })
  } catch (err) {
    console.error('[import.controller] Falha na extraÃ§Ã£o Gemini:', err)
    logRequestEvent(req, 'import.extraction_failed', { userId, imageId: image.id, error: String(err) })
    await db.update(importImages).set({ status: 'failed' }).where(eq(importImages.id, image.id))
    res.status(500).json({ error: 'extraction_failed', message: 'NÃ£o foi possÃ­vel extrair as transaÃ§Ãµes. Tente novamente.' })
    return
  }
}

// â”€â”€â”€ POST /import/validate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const validateSchema = z.object({
  bank: z.enum(SUPPORTED_BANKS),
  format: z.enum(SUPPORTED_FORMATS).default('screenshot'),
  fileBase64: z.string().min(1).optional(),
  imageBase64: z.string().min(1).optional(),
  fileName: z.string().trim().min(1).max(255).optional(),
  mimeType: z.string().trim().min(1).max(255).optional(),
  validationStrategy: z.enum(['gemini', 'tesseract']).default('tesseract'),
}).refine((data) => Boolean(data.fileBase64 ?? data.imageBase64), {
  message: 'Arquivo Ã© obrigatÃ³rio',
  path: ['fileBase64'],
})

export const importValidate: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId

  const parsed = validateSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { bank, format, fileBase64, imageBase64, fileName, mimeType, validationStrategy } = parsed.data
  const uploadBase64 = (fileBase64 ?? imageBase64)!

  const imageHash = createHash('sha256').update(uploadBase64).digest('hex')

  const [existing] = await db
    .select({ id: importImages.id })
    .from(importImages)
    .where(and(eq(importImages.userId, userId), eq(importImages.imageHash, imageHash)))

  if (existing) {
    res.status(409).json({ error: 'Arquivo jÃ¡ processado anteriormente', imageId: existing.id })
    return
  }

  const [image] = await db
    .insert(importImages)
    .values({ userId, imageHash, bank, format, status: 'pending' })
    .returning()

  const filePath = await saveUploadedFile({ userId, imageId: image.id, format, mimeType, base64: uploadBase64 })

  await db.update(importImages).set({ filePath }).where(eq(importImages.id, image.id))
  await db.insert(importSessions).values({ userId, imageId: image.id, sessionToken: image.id, extractedCount: 0, confirmedCount: 0 })

  logRequestEvent(req, 'import.file_saved', { userId, imageId: image.id, filePath, fileName })

  if (format !== 'screenshot') {
    res.status(200).json({ data: { imageId: image.id, valid: true, detectedDate: null } })
    return
  }

  const absoluteFilePath = join(API_ROOT, filePath)
  const validation = await validateImageHasDateHeader(absoluteFilePath, validationStrategy as ValidationStrategy)

  if (!validation.valid) {
    await db.update(importImages).set({ status: 'failed' }).where(eq(importImages.id, image.id))
    res.status(400).json({ error: 'header_not_found', message: 'A imagem nÃ£o contÃ©m um cabeÃ§alho de data visÃ­vel.' })
    return
  }

  res.status(200).json({ data: { imageId: image.id, valid: true, detectedDate: validation.detectedDate ?? null } })
}

// â”€â”€â”€ GET /import/image/:imageId â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Serve o arquivo de imagem diretamente do filesystem para o mobile exibir na galeria.

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export const importServeImage: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  const { imageId } = req.params

  const userDir = join(DATA_IMPORT_IMAGES_ROOT, userId)
  const extensions = Object.keys(MIME_BY_EXT)

  let foundPath: string | null = null
  for (const ext of extensions) {
    const candidate = join(userDir, `${imageId}${ext}`)
    if (existsSync(candidate)) { foundPath = candidate; break }
  }

  if (!foundPath) {
    res.status(404).json({ error: 'Imagem nÃ£o encontrada' })
    return
  }

  const mime = MIME_BY_EXT[extname(foundPath)] ?? 'application/octet-stream'
  res.setHeader('Content-Type', mime)
  res.setHeader('Cache-Control', 'private, max-age=3600')
  createReadStream(foundPath).pipe(res)
}

// â”€â”€â”€ GET /import/gallery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LÃª a pasta data_import/images/{userId}/ e retorna todos os arquivos disponÃ­veis.
// A deduplicaÃ§Ã£o continua via hash no banco â€” este endpoint sÃ³ lista o filesystem.

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export const importGallery: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  const userDir = join(DATA_IMPORT_IMAGES_ROOT, userId)

  let files: string[]
  try {
    files = await readdir(userDir)
  } catch {
    // Pasta ainda nÃ£o existe â€” nenhuma imagem enviada
    res.json({ data: [] })
    return
  }

  const imageFiles = files.filter(f => IMAGE_EXTENSIONS.has(f.slice(f.lastIndexOf('.')).toLowerCase()))

  const items = await Promise.all(
    imageFiles.map(async (fileName) => {
      const fullPath = join(userDir, fileName)
      const fileStat = await stat(fullPath)
      const imageId = fileName.slice(0, fileName.lastIndexOf('.')) // UUID sem extensÃ£o
      return {
        imageId,
        fileName,
        filePath: `data_import/images/${userId}/${fileName}`,
        createdAt: fileStat.birthtime.toISOString(),
        sizeBytes: fileStat.size,
      }
    })
  )

  // Mais recentes primeiro
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  res.json({ data: items })
}

// ─── DELETE /import/image/:imageId ──────────────────────────────────────────
// Remove o arquivo do disco e os registros do banco (cascade apaga sessions e extracted_transactions).

export const importDeleteImage: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  const { imageId } = req.params

  const [image] = await db
    .select({ id: importImages.id, filePath: importImages.filePath })
    .from(importImages)
    .where(and(eq(importImages.id, imageId), eq(importImages.userId, userId)))

  if (!image) {
    res.status(404).json({ error: 'Imagem não encontrada' })
    return
  }

  // Remove arquivo do disco (se existir)
  if (image.filePath) {
    const { unlink } = await import('fs/promises')
    const absolutePath = join(API_ROOT, image.filePath)
    await unlink(absolutePath).catch(() => {})
  }

  // Remove registro do banco (cascade apaga import_sessions e import_extracted_transactions)
  await db.delete(importImages).where(eq(importImages.id, image.id))

  logRequestEvent(req, 'import.image_deleted', { userId, imageId: image.id })
  res.status(200).json({ data: { deleted: true } })
}

// ─── POST /import/confirm ────────────────────────────────────────────────────

const confirmSchema = z.object({
  transactions: z.array(z.object({
    id: z.string().uuid(),
    categoryId: z.string().uuid(),
    discard: z.boolean().optional().default(false),
  })).min(1),
})

export const importConfirm: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId

  const parsed = confirmSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { transactions: items } = parsed.data
  const ids = items.map(i => i.id)
  const itemById = new Map(items.map(i => [i.id, i]))

  const extracted = await db
    .select()
    .from(importExtractedTransactions)
    .where(and(
      inArray(importExtractedTransactions.id, ids),
      eq(importExtractedTransactions.userId, userId),
      eq(importExtractedTransactions.status, 'pending'),
    ))

  if (extracted.length === 0) {
    res.status(404).json({ error: 'Nenhuma transação pendente encontrada' })
    return
  }

  const toDiscard = extracted.filter(ext => itemById.get(ext.id)!.discard)
  const toConfirm = extracted.filter(ext => !itemById.get(ext.id)!.discard)
  const imageIds = new Set(extracted.map(ext => ext.imageId))

  const { confirmed, discarded } = await db.transaction(async (tx) => {
    if (toDiscard.length > 0) {
      await tx
        .update(importExtractedTransactions)
        .set({ status: 'discarded' })
        .where(inArray(importExtractedTransactions.id, toDiscard.map(ext => ext.id)))
    }

    if (toConfirm.length > 0) {
      const created = await tx
        .insert(transactions)
        .values(toConfirm.map(ext => ({
          userId,
          categoryId: itemById.get(ext.id)!.categoryId,
          title: ext.title,
          amount: ext.amount,
          type: ext.type as 'income' | 'expense',
          date: ext.date,
          notes: ext.description ?? undefined,
        })))
        .returning({ id: transactions.id })

      // Um único UPDATE com CASE, em vez de N updates sequenciais (cada round-trip
      // ao banco custa ~70ms na rede da VPS — N=50 sequenciais levaria ~3.5s).
      const caseTransactionId = sql.join(
        toConfirm.map((ext, i) => sql`WHEN ${ext.id}::uuid THEN ${created[i].id}::uuid`),
        sql` `,
      )
      await tx
        .update(importExtractedTransactions)
        .set({
          status: 'confirmed',
          transactionId: sql`(CASE ${importExtractedTransactions.id} ${caseTransactionId} END)`,
        })
        .where(inArray(importExtractedTransactions.id, toConfirm.map(ext => ext.id)))
    }

    return { confirmed: toConfirm.length, discarded: toDiscard.length }
  })

  await Promise.all(
    Array.from(imageIds).map(imageId =>
      db
        .update(importSessions)
        .set({ confirmedCount: confirmed })
        .where(eq(importSessions.imageId, imageId))
    )
  )

  logRequestEvent(req, 'import.confirmed', { userId, confirmed, discarded })

  res.status(200).json({ data: { confirmed, discarded } })
}

