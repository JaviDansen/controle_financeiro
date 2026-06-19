import { RequestHandler } from 'express'
import { and, eq, gte, lt, sql } from 'drizzle-orm'
import { z } from 'zod'
import { categories, db, transactions } from '@finapp/db'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'
import { logRequestEvent } from '../middlewares/request-logger.middleware'

const createTransactionSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().uuid(),
  cardId: z.string().uuid().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date deve estar no formato YYYY-MM-DD'),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  status: z.enum(['confirmed', 'pending', 'cancelled']).default('confirmed'),
})

const updateTransactionSchema = createTransactionSchema.partial()

const monthQuerySchema = z.string().regex(/^\d{4}-\d{2}$/, 'month deve estar no formato YYYY-MM')

function monthRange(month: string): { start: string; end: string } {
  const [year, m] = month.split('-').map(Number)
  const start = `${month}-01`
  const nextMonth = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`
  const end = `${nextMonth}-01`
  return { start, end }
}

function toTransactionDto(
  tx: typeof transactions.$inferSelect,
  cat: { name: string; color: string | null; icon: string | null }
) {
  return {
    id: tx.id,
    title: tx.title,
    amount: parseFloat(tx.amount as string),
    type: tx.type as 'income' | 'expense',
    status: tx.status,
    categoryId: tx.categoryId,
    categoryName: cat.name,
    categoryColor: cat.color ?? '#8B8B92',
    categoryIcon: cat.icon ?? null,
    cardId: tx.cardId ?? null,
    date: tx.date,
    notes: tx.notes ?? null,
    isRecurring: tx.isRecurring,
    createdAt: tx.createdAt,
  }
}

export const listTransactions: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  logRequestEvent(req, 'transactions.list.started', { userId })

  const monthParsed = monthQuerySchema.safeParse(req.query.month)
  if (!monthParsed.success) {
    logRequestEvent(req, 'transactions.list.invalid_month', { userId, month: req.query.month })
    res.status(400).json({ error: monthParsed.error.errors[0].message })
    return
  }

  const month = monthParsed.data
  const { start, end } = monthRange(month)

  const rows = await db
    .select({
      tx: transactions,
      catName: categories.name,
      catColor: categories.color,
      catIcon: categories.icon,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, start),
        lt(transactions.date, end)
      )
    )
    .orderBy(sql`${transactions.date} desc, ${transactions.createdAt} desc`)

  const txList = rows.map(r =>
    toTransactionDto(r.tx, { name: r.catName, color: r.catColor, icon: r.catIcon })
  )

  const income = txList
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0)

  const expense = txList
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0)

  const balance = parseFloat((income - expense).toFixed(2))

  logRequestEvent(req, 'transactions.list.success', { userId, count: txList.length, month })
  res.json({
    data: {
      summary: {
        income: parseFloat(income.toFixed(2)),
        expense: parseFloat(expense.toFixed(2)),
        balance,
        month,
      },
      transactions: txList,
    },
  })
}

export const createTransaction: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  logRequestEvent(req, 'transactions.create.validation_started', { userId })

  const parsed = createTransactionSchema.safeParse(req.body)
  if (!parsed.success) {
    logRequestEvent(req, 'transactions.create.validation_failed', { userId, error: parsed.error.errors[0].message })
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const data = parsed.data

  const [cat] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, data.categoryId), eq(categories.userId, userId)))
    .limit(1)

  if (!cat) {
    logRequestEvent(req, 'transactions.create.category_not_found', { userId, categoryId: data.categoryId })
    res.status(404).json({ error: 'Categoria nao encontrada' })
    return
  }

  const [tx] = await db
    .insert(transactions)
    .values({
      userId,
      categoryId: data.categoryId,
      cardId: data.cardId ?? null,
      title: data.title,
      amount: data.amount.toString(),
      type: data.type,
      date: data.date,
      notes: data.notes ?? null,
      isRecurring: data.isRecurring,
      status: data.status,
    })
    .returning()

  logRequestEvent(req, 'transactions.create.success', { userId, transactionId: tx.id })
  res.status(201).json({
    data: {
      id: tx.id,
      title: tx.title,
      amount: parseFloat(tx.amount as string),
      type: tx.type,
      status: tx.status,
      categoryId: tx.categoryId,
      cardId: tx.cardId ?? null,
      date: tx.date,
      notes: tx.notes ?? null,
      isRecurring: tx.isRecurring,
      createdAt: tx.createdAt,
    },
  })
}

export const updateTransaction: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  const txId = req.params.id
  logRequestEvent(req, 'transactions.update.validation_started', { userId, txId })

  const parsed = updateTransactionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const [existing] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, txId), eq(transactions.userId, userId)))
    .limit(1)

  if (!existing) {
    logRequestEvent(req, 'transactions.update.not_found', { userId, txId })
    res.status(404).json({ error: 'Transacao nao encontrada' })
    return
  }

  const data = parsed.data
  const updateData: Partial<typeof transactions.$inferInsert> = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.amount !== undefined) updateData.amount = data.amount.toString()
  if (data.type !== undefined) updateData.type = data.type
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
  if (data.cardId !== undefined) updateData.cardId = data.cardId ?? null
  if (data.date !== undefined) updateData.date = data.date
  if (data.notes !== undefined) updateData.notes = data.notes ?? null
  if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring
  if (data.status !== undefined) updateData.status = data.status

  if (Object.keys(updateData).length === 0) {
    res.json({
      data: {
        id: existing.id,
        title: existing.title,
        amount: parseFloat(existing.amount as string),
        type: existing.type,
        status: existing.status,
        categoryId: existing.categoryId,
        cardId: existing.cardId ?? null,
        date: existing.date,
        notes: existing.notes ?? null,
        isRecurring: existing.isRecurring,
        createdAt: existing.createdAt,
      },
    })
    return
  }

  const [updated] = await db
    .update(transactions)
    .set(updateData)
    .where(and(eq(transactions.id, txId), eq(transactions.userId, userId)))
    .returning()

  logRequestEvent(req, 'transactions.update.success', { userId, txId })
  res.json({
    data: {
      id: updated.id,
      title: updated.title,
      amount: parseFloat(updated.amount as string),
      type: updated.type,
      status: updated.status,
      categoryId: updated.categoryId,
      cardId: updated.cardId ?? null,
      date: updated.date,
      notes: updated.notes ?? null,
      isRecurring: updated.isRecurring,
      createdAt: updated.createdAt,
    },
  })
}

export const deleteTransaction: RequestHandler = async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId
  const txId = req.params.id
  logRequestEvent(req, 'transactions.delete.started', { userId, txId })

  const [existing] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(and(eq(transactions.id, txId), eq(transactions.userId, userId)))
    .limit(1)

  if (!existing) {
    logRequestEvent(req, 'transactions.delete.not_found', { userId, txId })
    res.status(404).json({ error: 'Transacao nao encontrada' })
    return
  }

  await db.delete(transactions).where(and(eq(transactions.id, txId), eq(transactions.userId, userId)))

  logRequestEvent(req, 'transactions.delete.success', { userId, txId })
  res.status(204).send()
}
