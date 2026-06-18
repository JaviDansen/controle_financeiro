import { RequestHandler } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { categories, db } from '@finapp/db'
import { AuthenticatedRequest } from '../middlewares/auth.middleware'
import { logRequestEvent } from '../middlewares/request-logger.middleware'

const createCategorySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  icon: z.string().optional(),
})

function toCategoryDto(cat: typeof categories.$inferSelect) {
  return {
    id: cat.id,
    name: cat.name,
    color: cat.color,
    icon: cat.icon,
  }
}

export const listCategories: RequestHandler = async (req, res, next) => {
  const { userId } = req as AuthenticatedRequest
  try {
    logRequestEvent(req, 'categories.list.started', { userId })
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.createdAt)
    logRequestEvent(req, 'categories.list.success', { userId, count: rows.length })
    res.json({ data: rows.map(toCategoryDto) })
  } catch (err) {
    next(err)
  }
}

export const createCategory: RequestHandler = async (req, res, next) => {
  const { userId } = req as AuthenticatedRequest
  try {
    logRequestEvent(req, 'categories.create.validation_started', { userId })
    const parsed = createCategorySchema.safeParse(req.body)
    if (!parsed.success) {
      logRequestEvent(req, 'categories.create.validation_failed', { userId, error: parsed.error.issues[0].message })
      res.status(400).json({ error: parsed.error.issues[0].message })
      return
    }
    const { name, color, icon } = parsed.data
    const [cat] = await db
      .insert(categories)
      .values({ userId, name, color, icon })
      .returning()
    logRequestEvent(req, 'categories.create.success', { userId, categoryId: cat.id })
    res.status(201).json({ data: toCategoryDto(cat) })
  } catch (err) {
    next(err)
  }
}
