import { Response } from 'express'
import { and, eq, gte, lt, sql } from 'drizzle-orm'
import { z } from 'zod'
import { cards, db, transactions } from '@finapp/db'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'

const createCardSchema = z.object({
  name: z.string().min(1),
  bank: z.string().min(1),
  type: z.enum(['credit', 'debit']),
  lastFour: z.string().length(4).optional(),
  holder: z.string().optional(),
  expiry: z.string().optional(),
  creditLimit: z.number().positive().optional(),
  closingDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  gradientFrom: z.string().optional(),
  gradientTo: z.string().optional(),
  accent: z.string().optional(),
})

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

export async function listCards(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userCards = await db.select().from(cards).where(eq(cards.userId, req.userId))
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
            eq(transactions.type, 'expense'),
            gte(transactions.date, start),
            lt(transactions.date, nextStart)
          )
        )

      return toCardDto(card, parseFloat(total?.amount ?? '0'))
    })
  )

  res.json({ data })
}

export async function createCard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const parsed = createCardSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const cardData = parsed.data
  const [card] = await db
    .insert(cards)
    .values({
      userId: req.userId,
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
    .returning({
      id: cards.id,
      name: cards.name,
      bank: cards.bank,
      type: cards.type,
      lastFour: cards.lastFour,
      holder: cards.holder,
      expiry: cards.expiry,
      creditLimit: cards.creditLimit,
      closingDay: cards.closingDay,
      dueDay: cards.dueDay,
      color: cards.color,
      gradientTo: cards.gradientTo,
      accent: cards.accent,
      createdAt: cards.createdAt,
    })

  res.status(201).json({ data: card })
}
