import { RequestHandler } from 'express'
import { createHash } from 'crypto'
import { join } from 'path'
import { z } from 'zod'
import { and, eq, desc } from 'drizzle-orm'
import { db, importImages, importSessions, importExtractedTransactions } from '@finapp/db'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'
import { logRequestEvent } from '../middlewares/request-logger.middleware'
import { saveUploadedFile } from '../services/file-storage.service'
import { validateImageHasDateHeader, ValidationStrategy } from '../services/gemini/validator'
import { extractFromImage } from '../services/gemini/gemini.service'
import { TransacaoExtraida } from '../services/gemini/types'

const API_ROOT = join(__dirname, '../../')

const SUPPORTED_BANKS = ['mercadopago'] as const
const SUPPORTED_FORMATS = ['screenshot', 'csv', 'pdf', 'xls', 'xlsx'] as const

const importSchema = z.object({
  bank: z.enum(SUPPORTED_BANKS),
  format: z.enum(SUPPORTED_FORMATS).default('screenshot'),
  fileBase64: z.string().min(1).optional(),
  imageBase64: z.string().min(1).optional(),
  fileName: z.string().trim().min(1).max(255).optional(),
  mimeType: z.string().trim().min(1).max(255).optional(),
  validationStrategy: z.enum(['gemini', 'tesseract']).default('tesseract'),
}).refine((data) => Boolean(data.fileBase64 ?? data.imageBase64), {
  message: 'Arquivo é obrigatório',
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

  const { bank, format, fileBase64, imageBase64, fileName, mimeType, validationStrategy } = parsed.data
  const uploadBase64 = (fileBase64 ?? imageBase64)!

  const imageHash = createHash('sha256').update(uploadBase64).digest('hex')

  const [existing] = await db
    .select({ id: importImages.id })
    .from(importImages)
    .where(and(eq(importImages.userId, userId), eq(importImages.imageHash, imageHash)))

  if (existing) {
    logRequestEvent(req, 'import.duplicate', { userId, imageHash: imageHash.slice(0, 8) })
    res.status(409).json({ error: 'Arquivo ja processado anteriormente' })
    return
  }

  const [image] = await db
    .insert(importImages)
    .values({ userId, imageHash, bank, format, status: 'pending' })
    .returning()

  const filePath = await saveUploadedFile({
    userId,
    imageId: image.id,
    format,
    mimeType,
    base64: uploadBase64,
  })

  await db
    .update(importImages)
    .set({ filePath })
    .where(eq(importImages.id, image.id))

  await db
    .insert(importSessions)
    .values({ userId, imageId: image.id, extractedCount: 0, confirmedCount: 0 })

  logRequestEvent(req, 'import.file_saved', { userId, imageId: image.id, filePath })

  // Validação: screenshot deve ter cabeçalho de data visível
  if (format === 'screenshot') {
    const absoluteFilePath = join(API_ROOT, filePath)
    const validation = await validateImageHasDateHeader(absoluteFilePath, validationStrategy as ValidationStrategy)

    if (!validation.valid) {
      logRequestEvent(req, 'import.validation_failed', { userId, imageId: image.id, reason: validation.reason })
      await db.update(importImages).set({ status: 'failed' }).where(eq(importImages.id, image.id))
      res.status(400).json({
        error: 'header_not_found',
        message: 'A imagem não contém um cabeçalho de data visível. Certifique-se de que a lista de transações está visível com a data acima.',
      })
      return
    }
  }

  // Extração via Gemini
  let transactions: TransacaoExtraida[] = []
  try {
    const extraction = await extractFromImage({ filePath, bank, format })
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

    // Persiste transações extraídas
    if (transactions.length > 0) {
      await db.insert(importExtractedTransactions).values(
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
      )
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
  } catch (err) {
    console.error('[import.controller] Falha na extração Gemini:', err)
    logRequestEvent(req, 'import.extraction_failed', { userId, imageId: image.id, error: String(err) })
    await db.update(importImages).set({ status: 'failed' }).where(eq(importImages.id, image.id))
    res.status(500).json({ error: 'extraction_failed', message: 'Não foi possível extrair as transações. Tente novamente.' })
    return
  }

  res.status(201).json({
    data: {
      imageId: image.id,
      imageHash,
      bank,
      format,
      fileName,
      mimeType,
      transactions,
    },
  })
}

// ─── GET /import/history ────────────────────────────────────────────────────

export const importHistory: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId

  const images = await db
    .select({
      id: importImages.id,
      bank: importImages.bank,
      format: importImages.format,
      status: importImages.status,
      filePath: importImages.filePath,
      createdAt: importImages.createdAt,
    })
    .from(importImages)
    .where(eq(importImages.userId, userId))
    .orderBy(desc(importImages.createdAt))
    .limit(50)

  const result = await Promise.all(
    images.map(async (img) => {
      const transactions = await db
        .select({
          id: importExtractedTransactions.id,
          title: importExtractedTransactions.title,
          amount: importExtractedTransactions.amount,
          type: importExtractedTransactions.type,
          date: importExtractedTransactions.date,
          skipped: importExtractedTransactions.skipped,
        })
        .from(importExtractedTransactions)
        .where(and(
          eq(importExtractedTransactions.imageId, img.id),
          eq(importExtractedTransactions.skipped, false),
        ))
        .orderBy(importExtractedTransactions.date)
        .limit(3)

      const [session] = await db
        .select({ extractedCount: importSessions.extractedCount })
        .from(importSessions)
        .where(eq(importSessions.imageId, img.id))

      return {
        ...img,
        extractedCount: session?.extractedCount ?? 0,
        preview: transactions,
      }
    })
  )

  res.json({ data: result })
}

// ─── POST /import/reanalyze/:imageId ────────────────────────────────────────

const reanalyzeSchema = z.object({
  validationStrategy: z.enum(['gemini', 'tesseract']).default('tesseract'),
})

export const importReanalyze: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  const { imageId } = req.params

  const [image] = await db
    .select()
    .from(importImages)
    .where(and(eq(importImages.id, imageId), eq(importImages.userId, userId)))

  if (!image) {
    res.status(404).json({ error: 'Imagem não encontrada' })
    return
  }

  if (!image.filePath) {
    res.status(422).json({ error: 'Arquivo não disponível para reanálise' })
    return
  }

  const parsed = reanalyzeSchema.safeParse(req.body)
  const { validationStrategy } = parsed.success ? parsed.data : { validationStrategy: 'tesseract' as const }

  await db.update(importImages).set({ status: 'pending' }).where(eq(importImages.id, image.id))
  await db.delete(importExtractedTransactions).where(eq(importExtractedTransactions.imageId, image.id))

  if (image.format === 'screenshot') {
    const absoluteFilePath = join(API_ROOT, image.filePath)
    const validation = await validateImageHasDateHeader(absoluteFilePath, validationStrategy as ValidationStrategy)
    if (!validation.valid) {
      await db.update(importImages).set({ status: 'failed' }).where(eq(importImages.id, image.id))
      res.status(400).json({ error: 'header_not_found', message: 'A imagem não contém um cabeçalho de data visível.' })
      return
    }
  }

  let transactions: TransacaoExtraida[] = []
  try {
    const extraction = await extractFromImage({ filePath: image.filePath, bank: image.bank as 'mercadopago', format: image.format as any })
    transactions = extraction.transactions as TransacaoExtraida[]
    const { usage } = extraction

    await db.update(importImages).set({
      status: 'processed',
      tokensPrompt: usage.tokensPrompt,
      tokensOutput: usage.tokensOutput,
      tokensTotal: usage.tokensTotal,
      costBrl: usage.costBrl,
    }).where(eq(importImages.id, image.id))

    if (transactions.length > 0) {
      await db.insert(importExtractedTransactions).values(
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
      )
    }

    await db.update(importSessions)
      .set({ extractedCount: transactions.length })
      .where(eq(importSessions.imageId, image.id))

    logRequestEvent(req, 'import.reanalyzed', { userId, imageId: image.id, count: transactions.length })
  } catch (err) {
    await db.update(importImages).set({ status: 'failed' }).where(eq(importImages.id, image.id))
    res.status(500).json({ error: 'extraction_failed', message: 'Não foi possível extrair as transações.' })
    return
  }

  res.json({ data: { imageId: image.id, transactions } })
}
