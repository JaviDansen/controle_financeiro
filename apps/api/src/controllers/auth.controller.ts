import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
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

const loginSchema = z.object({
  email: z
    .string({ required_error: 'email é obrigatório' })
    .email('email com formato inválido'),
  password: z
    .string({ required_error: 'password é obrigatório' })
    .min(1, 'password é obrigatório'),
})

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'email é obrigatório' })
    .email('email com formato inválido'),
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

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { email, password } = parsed.data

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas' })
    return
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    res.status(401).json({ error: 'Credenciais inválidas' })
    return
  }

  const secret = process.env.JWT_SECRET ?? 'dev-secret'
  const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' })

  res.status(200).json({
    data: {
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
      },
    },
  })
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  res.status(200).json({
    data: { message: 'Se esse e-mail existir, você receberá um link em breve.' },
  })
}
