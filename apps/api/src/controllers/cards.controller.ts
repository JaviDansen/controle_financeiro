import { RequestHandler } from 'express'
import { and, eq, gte, lt, sql } from 'drizzle-orm'
import { z } from 'zod'
import { cards, db, transactions } from '@finapp/db'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'
import { logRequestEvent } from '../middlewares/request-logger.middleware'

const cardSchema = z.object({
  name: z.string().min(1),
  bank: z.string().min(1),
  type: z.enum(['credit', 'debit']),
  lastFour: z.string().length(4).optional(),
  holder: z.string().min(1),
  expiry: z.string().optional(),
  creditLimit: z.number().positive().optional(),
  closingDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  gradientFrom: z.string().min(1),
  gradientTo: z.string().min(1),
  accent: z.string().min(1),
})

const createCardSchema = cardSchema.superRefine((card, ctx) => {
  if (card.type !== 'credit') return

  if (card.creditLimit === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['creditLimit'],
      message: 'creditLimit e obrigatorio para cartao de credito',
    })
  }

  if (card.closingDay === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['closingDay'],
      message: 'closingDay e obrigatorio para cartao de credito',
    })
  }

  if (card.dueDay === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dueDay'],
      message: 'dueDay e obrigatorio para cartao de credito',
    })
  }
})

const updateCardSchema = cardSchema.partial()

type CardRow = typeof cards.$inferSelect

function toNumber(value: string | number | null): number | null {
  if (value === null) return null
  return typeof value === 'number' ? value : parseFloat(value)
}

function bestPurchaseDay(closingDay: number | null): number | null {
  if (closingDay === null) return null
  const day = closingDay + 3
  return day > 28 ? day - 28 : day
}

function toCardDto(card: CardRow, currentMonthTotal: number) {
  return {
    id: card.id,
    name: card.name,
    bank: card.bank,
    type: card.type as 'credit' | 'debit',
    last4: card.lastFour,
    holder: card.holder,
    expiry: card.expiry,
    limit: toNumber(card.creditLimit),
    closingDay: card.closingDay,
    dueDay: card.dueDay,
    bestPurchaseDay: bestPurchaseDay(card.closingDay),
    used: currentMonthTotal,
    currentMonthTotal,
    openInstallmentsCount: 0,
    openInstallmentsTotal: 0,
    gradientColors: [card.color ?? '#15151A', card.gradientTo ?? '#0A0A0A'],
    accent: card.accent,
  }
}

function currentMonthRange(): { start: string; nextStart: string } {
  const now = new Date()
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
  const nextStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1))

  return {
    start: start.toISOString().slice(0, 10),
    nextStart: nextStart.toISOString().slice(0, 10),
  }
}

export const listCards: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  logRequestEvent(req, 'cards.list.started', { userId })
  const userCards = await db.select().from(cards).where(eq(cards.userId, userId))
  const { start, nextStart } = currentMonthRange()

  const data = await Promise.all(
    userCards.map(async (card) => {
      const [total] = await db
        .select({
          amount: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.cardId, card.id),
            eq(transactions.userId, userId),
            eq(transactions.type, 'expense'),
            gte(transactions.date, start),
            lt(transactions.date, nextStart)
          )
        )

      return toCardDto(card, parseFloat(total?.amount ?? '0'))
    })
  )

  logRequestEvent(req, 'cards.list.success', { userId, cardsCount: data.length })
  res.json({ data })
}

function toCardMutationDto(card: CardRow) {
  return {
    id: card.id,
    name: card.name,
    bank: card.bank,
    type: card.type,
    lastFour: card.lastFour,
    holder: card.holder,
    expiry: card.expiry,
    creditLimit: card.creditLimit,
    closingDay: card.closingDay,
    dueDay: card.dueDay,
    color: card.color,
    gradientTo: card.gradientTo,
    accent: card.accent,
    createdAt: card.createdAt,
  }
}

export const createCard: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  logRequestEvent(req, 'cards.create.validation_started', { userId })
  const parsed = createCardSchema.safeParse(req.body)
  if (!parsed.success) {
    logRequestEvent(req, 'cards.create.validation_failed', { userId, error: parsed.error.errors[0].message })
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const cardData = parsed.data
  const [card] = await db
    .insert(cards)
    .values({
      userId,
      name: cardData.name,
      bank: cardData.bank,
      type: cardData.type,
      lastFour: cardData.lastFour,
      holder: cardData.holder,
      expiry: cardData.expiry,
      creditLimit: cardData.creditLimit?.toString(),
      closingDay: cardData.closingDay,
      dueDay: cardData.dueDay,
      color: cardData.gradientFrom,
      gradientTo: cardData.gradientTo,
      accent: cardData.accent,
    })
    .returning()

  logRequestEvent(req, 'cards.create.success', { userId, cardId: card.id, cardName: card.name })
  res.status(201).json({ data: toCardMutationDto(card) })
}

export const updateCard: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  const cardId = req.params.id
  logRequestEvent(req, 'cards.update.validation_started', { userId, cardId })

  const parsed = updateCardSchema.safeParse(req.body)
  if (!parsed.success) {
    logRequestEvent(req, 'cards.update.validation_failed', { userId, cardId, error: parsed.error.errors[0].message })
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const [existingCard] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
    .limit(1)

  if (!existingCard) {
    logRequestEvent(req, 'cards.update.not_found', { userId, cardId })
    res.status(404).json({ error: 'Cartao nao encontrado' })
    return
  }

  const cardData = parsed.data
  const updateData: Partial<typeof cards.$inferInsert> = {}

  if (cardData.name !== undefined) updateData.name = cardData.name
  if (cardData.bank !== undefined) updateData.bank = cardData.bank
  if (cardData.type !== undefined) updateData.type = cardData.type
  if (cardData.lastFour !== undefined) updateData.lastFour = cardData.lastFour
  if (cardData.holder !== undefined) updateData.holder = cardData.holder
  if (cardData.expiry !== undefined) updateData.expiry = cardData.expiry
  if (cardData.creditLimit !== undefined) updateData.creditLimit = cardData.creditLimit.toString()
  if (cardData.closingDay !== undefined) updateData.closingDay = cardData.closingDay
  if (cardData.dueDay !== undefined) updateData.dueDay = cardData.dueDay
  if (cardData.gradientFrom !== undefined) updateData.color = cardData.gradientFrom
  if (cardData.gradientTo !== undefined) updateData.gradientTo = cardData.gradientTo
  if (cardData.accent !== undefined) updateData.accent = cardData.accent

  if (Object.keys(updateData).length === 0) {
    res.json({ data: toCardMutationDto(existingCard) })
    return
  }

  const [updatedCard] = await db
    .update(cards)
    .set(updateData)
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
    .returning()

  logRequestEvent(req, 'cards.update.success', { userId, cardId })
  res.json({ data: toCardMutationDto(updatedCard) })
}

export const deleteCard: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  const cardId = req.params.id
  logRequestEvent(req, 'cards.delete.started', { userId, cardId })

  const [existingCard] = await db
    .select()
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
    .limit(1)

  if (!existingCard) {
    logRequestEvent(req, 'cards.delete.not_found', { userId, cardId })
    res.status(404).json({ error: 'Cartao nao encontrado' })
    return
  }

  await db.delete(cards).where(and(eq(cards.id, cardId), eq(cards.userId, userId)))

  logRequestEvent(req, 'cards.delete.success', { userId, cardId })
  res.status(204).send()
}
