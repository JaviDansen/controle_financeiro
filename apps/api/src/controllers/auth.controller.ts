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
    .min(8, 'password deve ter no mínimo 8 caracteres'),
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

const loginSchema = z.object({
  email: z.string({ required_error: 'email é obrigatório' }).email('email com formato inválido'),
  password: z.string({ required_error: 'password é obrigatório' }),
})

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { email, password } = parsed.data

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  const user = existing[0]

  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas' })
    return
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Credenciais inválidas' })
    return
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })

  res.status(200).json({
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  })
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: { message: 'Logout realizado com sucesso' } })
}

const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'email é obrigatório' }).email(),
})

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }
  
  // Resposta sempre 200 para evitar enumeramento de e-mails
  res.status(200).json({ data: { message: 'Se o e-mail existir, um link de recuperação foi enviado.' } })
}

const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'token é obrigatório' }),
  newPassword: z.string({ required_error: 'newPassword é obrigatório' }).min(8, 'password deve ter no mínimo 8 caracteres'),
})

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }
  
  const { token, newPassword } = parsed.data
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string }
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await db.update(users).set({ passwordHash }).where(eq(users.id, decoded.userId))
    res.status(200).json({ data: { message: 'Senha atualizada com sucesso' } })
  } catch (error) {
    res.status(400).json({ error: 'Token inválido ou expirado' })
  }
}
