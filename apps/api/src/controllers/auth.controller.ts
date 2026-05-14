import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, users } from '@finapp/db'

const registerSchema = z.object({
  name: z
    .string({ required_error: 'name é obrigatório' })
    .min(1, 'name é obrigatório'),
  email: z
    .string({ required_error: 'email é obrigatório' })
    .email('email com formato inválido'),
  password: z
    .string({ required_error: 'password é obrigatório' })
    .min(6, 'password deve ter no mínimo 6 caracteres'),
})

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { name, email, password } = parsed.data

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    res.status(409).json({ error: 'Email já cadastrado' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning({
      id:        users.id,
      name:      users.name,
      email:     users.email,
      createdAt: users.createdAt,
    })

  res.status(201).json({ data: user })
}
