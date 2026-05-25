import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, users } from '@finapp/db'
import { logRequestEvent } from '../middlewares/request-logger.middleware'

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

const loginSchema = z.object({
  email: z.string({ required_error: 'email é obrigatório' }).email('email com formato inválido'),
  password: z.string({ required_error: 'password é obrigatório' }),
})

const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'email é obrigatório' }).email(),
})

const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'token é obrigatório' }),
  newPassword: z
    .string({ required_error: 'newPassword é obrigatório' })
    .min(8, 'password deve ter no mínimo 8 caracteres'),
})

export async function register(req: Request, res: Response): Promise<void> {
  logRequestEvent(req, 'auth.register.validation_started')
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    logRequestEvent(req, 'auth.register.validation_failed', { error: parsed.error.errors[0].message })
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { name, email, password } = parsed.data
  logRequestEvent(req, 'auth.register.lookup_existing_user', { email })

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) {
    logRequestEvent(req, 'auth.register.duplicate_email', { email })
    res.status(409).json({ error: 'Email já cadastrado' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  logRequestEvent(req, 'auth.register.password_hashed')

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })

  logRequestEvent(req, 'auth.register.success', { userId: user.id, email: user.email })
  res.status(201).json({ data: user })
}

export async function login(req: Request, res: Response): Promise<void> {
  logRequestEvent(req, 'auth.login.validation_started')
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    logRequestEvent(req, 'auth.login.validation_failed', { error: parsed.error.errors[0].message })
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { email, password } = parsed.data
  logRequestEvent(req, 'auth.login.lookup_user', { email })

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  const user = existing[0]

  if (!user) {
    logRequestEvent(req, 'auth.login.user_not_found', { email })
    res.status(401).json({ error: 'Credenciais inválidas' })
    return
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    logRequestEvent(req, 'auth.login.invalid_password', { userId: user.id, email: user.email })
    res.status(401).json({ error: 'Credenciais inválidas' })
    return
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
  logRequestEvent(req, 'auth.login.success', { userId: user.id, email: user.email })

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
  logRequestEvent(req, 'auth.logout.success', { userId: req.userId })
  res.status(200).json({ data: { message: 'Logout realizado com sucesso' } })
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  logRequestEvent(req, 'auth.forgot_password.validation_started')
  const parsed = forgotPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    logRequestEvent(req, 'auth.forgot_password.validation_failed', { error: parsed.error.errors[0].message })
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  logRequestEvent(req, 'auth.forgot_password.accepted', { email: parsed.data.email })
  // Resposta sempre 200 para evitar enumeramento de e-mails
  res.status(200).json({ data: { message: 'Se o e-mail existir, um link de recuperação foi enviado.' } })
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  logRequestEvent(req, 'auth.reset_password.validation_started')
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    logRequestEvent(req, 'auth.reset_password.validation_failed', { error: parsed.error.errors[0].message })
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { token, newPassword } = parsed.data

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string }
    logRequestEvent(req, 'auth.reset_password.token_verified', { userId: decoded.userId })
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await db.update(users).set({ passwordHash }).where(eq(users.id, decoded.userId))
    logRequestEvent(req, 'auth.reset_password.success', { userId: decoded.userId })
    res.status(200).json({ data: { message: 'Senha atualizada com sucesso' } })
  } catch (error) {
    logRequestEvent(req, 'auth.reset_password.invalid_token')
    res.status(400).json({ error: 'Token inválido ou expirado' })
  }
}
