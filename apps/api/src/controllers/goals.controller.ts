import { RequestHandler } from 'express'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { goals, db } from '@finapp/db'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'
import { logRequestEvent } from '../middlewares/request-logger.middleware'

const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().default(0),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  emoji: z.string().max(20).optional().nullable(),
}).refine((data) => data.currentAmount <= data.targetAmount, {
  message: 'currentAmount nao pode exceder targetAmount',
  path: ['currentAmount'],
})

const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().nonnegative().optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  emoji: z.string().max(20).optional().nullable(),
})

function toGoalDto(goal: typeof goals.$inferSelect) {
  return {
    id: goal.id,
    title: goal.title,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    deadline: goal.deadline,
    category: goal.category,
    isActive: goal.isActive,
    color: goal.color,
    emoji: goal.emoji,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  }
}

export const listGoals: RequestHandler = async (req, res, next) => {
  const { userId } = req as AuthenticatedRequest
  const { isActive } = req.query
  try {
    logRequestEvent(req, 'goals.list.started', { userId, isActive })

    let filter = eq(goals.userId, userId)
    if (isActive === 'true') {
      filter = and(filter, eq(goals.isActive, true)) as any
    } else if (isActive === 'false') {
      filter = and(filter, eq(goals.isActive, false)) as any
    }

    const rows = await db
      .select()
      .from(goals)
      .where(filter)
      .orderBy(goals.createdAt)

    logRequestEvent(req, 'goals.list.success', { userId, count: rows.length })
    res.json({ data: rows.map(toGoalDto) })
  } catch (err) {
    next(err)
  }
}

export const getGoalById: RequestHandler = async (req, res, next) => {
  const { userId } = req as AuthenticatedRequest
  const { id } = req.params
  try {
    logRequestEvent(req, 'goals.get_by_id.started', { userId, goalId: id })

    const [goal] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))

    if (!goal) {
      logRequestEvent(req, 'goals.get_by_id.not_found', { userId, goalId: id })
      res.status(404).json({ error: 'Meta nao encontrada' })
      return
    }

    logRequestEvent(req, 'goals.get_by_id.success', { userId, goalId: id })
    res.json({ data: toGoalDto(goal) })
  } catch (err) {
    next(err)
  }
}

export const createGoal: RequestHandler = async (req, res, next) => {
  const { userId } = req as AuthenticatedRequest
  try {
    logRequestEvent(req, 'goals.create.validation_started', { userId })
    const parsed = createGoalSchema.safeParse(req.body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0].message
      logRequestEvent(req, 'goals.create.validation_failed', { userId, error: errorMsg })
      res.status(400).json({ error: errorMsg })
      return
    }

    const val = parsed.data
    const [goal] = await db
      .insert(goals)
      .values({
        userId,
        title: val.title,
        targetAmount: String(val.targetAmount),
        currentAmount: String(val.currentAmount),
        deadline: val.deadline,
        category: val.category,
        isActive: val.isActive,
        color: val.color,
        emoji: val.emoji,
      })
      .returning()

    logRequestEvent(req, 'goals.create.success', { userId, goalId: goal.id })
    res.status(201).json({ data: toGoalDto(goal) })
  } catch (err) {
    next(err)
  }
}

export const updateGoal: RequestHandler = async (req, res, next) => {
  const { userId } = req as AuthenticatedRequest
  const { id } = req.params
  try {
    logRequestEvent(req, 'goals.update.validation_started', { userId, goalId: id })
    const parsed = updateGoalSchema.safeParse(req.body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0].message
      logRequestEvent(req, 'goals.update.validation_failed', { userId, error: errorMsg })
      res.status(400).json({ error: errorMsg })
      return
    }

    const [existing] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))

    if (!existing) {
      logRequestEvent(req, 'goals.update.not_found', { userId, goalId: id })
      res.status(404).json({ error: 'Meta nao encontrada' })
      return
    }

    const val = parsed.data
    const target = val.targetAmount !== undefined ? val.targetAmount : Number(existing.targetAmount)
    const current = val.currentAmount !== undefined ? val.currentAmount : Number(existing.currentAmount)

    if (current > target) {
      logRequestEvent(req, 'goals.update.validation_failed', { userId, error: 'currentAmount nao pode exceder targetAmount' })
      res.status(400).json({ error: 'currentAmount nao pode exceder targetAmount' })
      return
    }

    const [updated] = await db
      .update(goals)
      .set({
        title: val.title !== undefined ? val.title : existing.title,
        targetAmount: val.targetAmount !== undefined ? String(val.targetAmount) : existing.targetAmount,
        currentAmount: val.currentAmount !== undefined ? String(val.currentAmount) : existing.currentAmount,
        deadline: val.deadline !== undefined ? val.deadline : existing.deadline,
        category: val.category !== undefined ? val.category : existing.category,
        isActive: val.isActive !== undefined ? val.isActive : existing.isActive,
        color: val.color !== undefined ? val.color : existing.color,
        emoji: val.emoji !== undefined ? val.emoji : existing.emoji,
        updatedAt: new Date(),
      })
      .where(eq(goals.id, id))
      .returning()

    logRequestEvent(req, 'goals.update.success', { userId, goalId: updated.id })
    res.json({ data: toGoalDto(updated) })
  } catch (err) {
    next(err)
  }
}

export const deleteGoal: RequestHandler = async (req, res, next) => {
  const { userId } = req as AuthenticatedRequest
  const { id } = req.params
  try {
    logRequestEvent(req, 'goals.delete.started', { userId, goalId: id })

    const [existing] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))

    if (!existing) {
      logRequestEvent(req, 'goals.delete.not_found', { userId, goalId: id })
      res.status(404).json({ error: 'Meta nao encontrada' })
      return
    }

    await db.delete(goals).where(eq(goals.id, id))

    logRequestEvent(req, 'goals.delete.success', { userId, goalId: id })
    res.json({ status: 'ok' })
  } catch (err) {
    next(err)
  }
}
