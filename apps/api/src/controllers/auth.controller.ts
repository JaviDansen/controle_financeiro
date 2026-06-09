import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { eq, or } from 'drizzle-orm'
import { z } from 'zod'
import { db, users } from '@finapp/db'
import { logRequestEvent } from '../middlewares/request-logger.middleware'
import { sendPasswordResetEmail } from '../services/google/gmail.service'
import { verifyGoogleToken } from '../services/google/oauth.service'

const registerSchema = z.object({
  name: z
    .string({ required_error: 'name é obrigatório' })
    .trim()
    .min(1, 'name é obrigatório')
    .refine((name) => name.split(/\s+/).length > 1, {
      message: 'Insira seu nome e sobrenome',
    }),
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

  if (!user.passwordHash) {
    logRequestEvent(req, 'auth.login.no_password_hash', { userId: user.id, email: user.email })
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

  const { email } = parsed.data
  logRequestEvent(req, 'auth.forgot_password.lookup_user', { email })

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  const user = existing[0]

  // Responde sempre 200 para não revelar se o e-mail existe
  if (user) {
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' })
    const resetLink = `${process.env.API_URL}/auth/reset-password?token=${resetToken}`

    try {
      await sendPasswordResetEmail(email, resetLink)
      logRequestEvent(req, 'auth.forgot_password.email_sent', { userId: user.id, email })
    } catch (err) {
      logRequestEvent(req, 'auth.forgot_password.email_error', { userId: user.id, email, error: String(err) })
    }
  }

  res.status(200).json({ data: { message: 'Se o e-mail existir, um link de recuperação foi enviado.' } })
}

export async function redirectResetPassword(req: Request, res: Response): Promise<void> {
  const token = req.query.token as string
  if (!token) {
    res.status(400).send('Token ausente.')
    return
  }

  const baseDeepLink = process.env.APP_DEEP_LINK ?? 'finapp://'
  // APP_DEEP_LINK em dev: exp://IP:8081/-- | em prod: finapp://
  const deepLink = `${baseDeepLink}reset-password?token=${encodeURIComponent(token)}`

  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinir senha — FinApp</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: #ECE7DC; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #FBFAF6; border-radius: 24px; padding: 40px 32px; max-width: 400px; width: 100%; text-align: center; }
    .brand { font-size: 28px; font-weight: 600; letter-spacing: -0.5px; color: #15151A; margin-bottom: 24px; }
    .dot { display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin: 0 3px 2px; vertical-align: middle; }
    h1 { font-size: 20px; font-weight: 600; color: #15151A; margin-bottom: 8px; }
    p { font-size: 14px; color: #3B3B43; margin-bottom: 32px; line-height: 1.5; }
    a.btn { display: block; background: #15151A; color: #fff; text-decoration: none; padding: 16px; border-radius: 16px; font-size: 16px; font-weight: 500; }
    .hint { font-size: 12px; color: #8B8B92; margin-top: 16px; }
  </style>
  <script>
    window.onload = function() {
      window.location.href = "${deepLink}";
    };
  </script>
</head>
<body>
  <div class="card">
    <div class="brand">fin<span class="dot"></span>app</div>
    <h1>Redefinir sua senha</h1>
    <p>Toque no botão abaixo para abrir o aplicativo e criar uma nova senha.</p>
    <a href="${deepLink}" class="btn">Abrir no FinApp</a>
    <p class="hint">Se o app não abrir, certifique-se de que o FinApp está instalado.</p>
  </div>
</body>
</html>`)
}

const googleLoginSchema = z.object({
  idToken: z.string({ required_error: 'idToken é obrigatório' }),
})

export async function googleLogin(req: Request, res: Response): Promise<void> {
  logRequestEvent(req, 'auth.google_login.validation_started')
  const parsed = googleLoginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { idToken } = parsed.data

  let payload: { googleId: string; email: string; name: string }
  try {
    payload = await verifyGoogleToken(idToken)
  } catch {
    logRequestEvent(req, 'auth.google_login.invalid_token')
    res.status(401).json({ error: 'Token Google inválido' })
    return
  }

  const { googleId, email, name } = payload

  logRequestEvent(req, 'auth.google_login.schema_check', { googleIdField: String(users.googleId?.name) })

  const existing = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      googleId: users.googleId,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(or(eq(users.googleId, googleId), eq(users.email, email)))
    .limit(1)

  let user = existing[0]

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({ name, email, googleId })
      .returning({ id: users.id, name: users.name, email: users.email })
    user = created as typeof user
    logRequestEvent(req, 'auth.google_login.user_created', { userId: user.id, email })
  } else if (!user.googleId) {
    await db.update(users).set({ googleId }).where(eq(users.id, user.id))
    logRequestEvent(req, 'auth.google_login.google_id_linked', { userId: user.id, email })
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
  logRequestEvent(req, 'auth.google_login.success', { userId: user.id, email })

  res.status(200).json({
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    },
  })
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
