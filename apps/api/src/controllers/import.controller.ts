import { RequestHandler } from 'express'
import { createHash } from 'crypto'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db, importImages, importSessions } from '@finapp/db'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'
import { logRequestEvent } from '../middlewares/request-logger.middleware'

const SUPPORTED_BANKS = ['mercadopago'] as const
const SUPPORTED_FORMATS = ['screenshot', 'csv', 'pdf', 'xls', 'xlsx'] as const

const importSchema = z.object({
  bank: z.enum(SUPPORTED_BANKS),
  format: z.enum(SUPPORTED_FORMATS).default('screenshot'),
  fileBase64: z.string().min(1).optional(),
  imageBase64: z.string().min(1).optional(),
  fileName: z.string().trim().min(1).max(255).optional(),
  mimeType: z.string().trim().min(1).max(255).optional(),
}).refine((data) => Boolean(data.fileBase64 ?? data.imageBase64), {
  message: 'Arquivo é obrigatório',
  path: ['fileBase64'],
})

export const importExtract: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  logRequestEvent(req, 'import.started', { userId })

  const parsed = importSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { bank, format, fileBase64, imageBase64, fileName, mimeType } = parsed.data
  const uploadBase64 = fileBase64 ?? imageBase64!

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
    .values({ userId, imageHash, bank, format, status: 'processed' })
    .returning()

  await db
    .insert(importSessions)
    .values({ userId, imageId: image.id, extractedCount: 0, confirmedCount: 0 })

  logRequestEvent(req, 'import.success', { userId, imageId: image.id, bank })

  res.status(201).json({
    data: {
      imageId: image.id,
      imageHash,
      bank,
      format,
      fileName,
      mimeType,
      transactions: [],
    },
  })
}
