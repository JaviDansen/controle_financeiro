import jwt from 'jsonwebtoken'
import { api } from './helpers/app'
import { db, passwordResets, users } from '@finapp/db'
import { eq } from 'drizzle-orm'

let seq = 0
function uniqueEmail(base = 'joao@teste.com') {
  seq += 1
  const [local, domain] = base.split('@')
  return `${local}+${Date.now()}-${seq}@${domain}`
}

const BASE_USER = { name: 'João Teste', password: 'senha123' }

async function registerUser(overrides: Record<string, unknown> = {}) {
  const email = uniqueEmail()
  await api().post('/auth/register').send({ ...BASE_USER, email, ...overrides })
  return email
}

async function registerAndLogin(overrides: Record<string, unknown> = {}) {
  const email = uniqueEmail()
  await api().post('/auth/register').send({ ...BASE_USER, email, ...overrides })
  const res = await api().post('/auth/login').send({ email, password: BASE_USER.password })
  return { email, token: res.body.data?.token as string }
}

// ─────────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('201: cria usuário com dados válidos', async () => {
    const res = await api().post('/auth/register').send({ ...BASE_USER, email: uniqueEmail() })
    expect(res.status).toBe(201)
  })

  it('retorna id, name, email e createdAt do usuário criado', async () => {
    const email = uniqueEmail()
    const res = await api().post('/auth/register').send({ ...BASE_USER, email })
    expect(res.body.data).toHaveProperty('id')
    expect(res.body.data).toHaveProperty('name', BASE_USER.name)
    expect(res.body.data).toHaveProperty('email', email)
    expect(res.body.data).toHaveProperty('createdAt')
  })

  it('nunca expõe passwordHash na resposta', async () => {
    const res = await api().post('/auth/register').send({ ...BASE_USER, email: uniqueEmail() })
    expect(res.body.data).not.toHaveProperty('passwordHash')
    expect(res.body.data).not.toHaveProperty('password_hash')
    expect(res.body.data).not.toHaveProperty('password')
  })

  it('409: email já cadastrado', async () => {
    const email = uniqueEmail()
    await api().post('/auth/register').send({ ...BASE_USER, email })
    const res = await api().post('/auth/register').send({ ...BASE_USER, email })
    expect(res.status).toBe(409)
    expect(res.body).toHaveProperty('error')
  })

  it('400: name ausente', async () => {
    const res = await api().post('/auth/register').send({ email: uniqueEmail(), password: BASE_USER.password })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: name sem sobrenome', async () => {
    const res = await api().post('/auth/register').send({ ...BASE_USER, email: uniqueEmail(), name: 'João' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: email ausente', async () => {
    const res = await api().post('/auth/register').send({ name: BASE_USER.name, password: BASE_USER.password })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: password ausente', async () => {
    const res = await api().post('/auth/register').send({ ...BASE_USER, email: uniqueEmail(), password: undefined })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: email com formato inválido', async () => {
    const res = await api().post('/auth/register').send({ ...BASE_USER, email: 'nao-é-um-email' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: password com menos de 8 caracteres', async () => {
    const res = await api().post('/auth/register').send({ ...BASE_USER, email: uniqueEmail(), password: '1234567' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

// ─────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  let email: string

  beforeAll(async () => {
    email = await registerUser()
  })

  it('200: retorna token JWT com credenciais válidas', async () => {
    const res = await api().post('/auth/login').send({ email, password: BASE_USER.password })
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('token')
  })

  it('token retornado tem formato JWT (três partes separadas por ponto)', async () => {
    const res = await api().post('/auth/login').send({ email, password: BASE_USER.password })
    expect(res.body.data.token.split('.')).toHaveLength(3)
  })

  it('payload do JWT contém userId', async () => {
    const res = await api().post('/auth/login').send({ email, password: BASE_USER.password })
    const payload = jwt.decode(res.body.data.token) as { userId?: string }
    expect(payload).toHaveProperty('userId')
    expect(typeof payload.userId).toBe('string')
  })

  it('retorna dados do usuário junto com o token', async () => {
    const res = await api().post('/auth/login').send({ email, password: BASE_USER.password })
    expect(res.body.data.user).toHaveProperty('id')
    expect(res.body.data.user).toHaveProperty('name', BASE_USER.name)
    expect(res.body.data.user).toHaveProperty('email', email)
  })

  it('nunca expõe passwordHash na resposta de login', async () => {
    const res = await api().post('/auth/login').send({ email, password: BASE_USER.password })
    expect(res.body.data.user).not.toHaveProperty('passwordHash')
    expect(res.body.data.user).not.toHaveProperty('password_hash')
    expect(res.body.data.user).not.toHaveProperty('password')
  })

  it('401: senha incorreta', async () => {
    const res = await api().post('/auth/login').send({ email, password: 'senha-errada' })
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('401: email não cadastrado', async () => {
    const res = await api().post('/auth/login').send({ email: 'nao-existe@teste.com', password: 'qualquer' })
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('400: email ausente', async () => {
    const res = await api().post('/auth/login').send({ password: 'senha123' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: password ausente', async () => {
    const res = await api().post('/auth/login').send({ email })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

// ─────────────────────────────────────────────────────
// POST /auth/forgot-password
// ─────────────────────────────────────────────────────

describe('POST /auth/forgot-password', () => {
  let email: string

  beforeAll(async () => {
    email = await registerUser()
  })

  it('200: email cadastrado → confirma solicitação e cria código no banco', async () => {
    const res = await api().post('/auth/forgot-password').send({ email })
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('message')

    // Verifica inserção no banco
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const resets = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id))
    expect(resets).toHaveLength(1)
    expect(resets[0].code).toHaveLength(6)
    expect(resets[0].statusCode).toBe('pending')
  })

  it('200: email NÃO cadastrado → mesma resposta (não revela se existe)', async () => {
    const res = await api().post('/auth/forgot-password').send({ email: 'nao-existe@teste.com' })
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('message')
  })

  it('400: email ausente', async () => {
    const res = await api().post('/auth/forgot-password').send({})
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: email com formato inválido', async () => {
    const res = await api().post('/auth/forgot-password').send({ email: 'nao-é-email' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

// ─────────────────────────────────────────────────────
// POST /auth/verify-code
// ─────────────────────────────────────────────────────

describe('POST /auth/verify-code', () => {
  it('200: código correto → retorna token JWT temporário', async () => {
    const email = await registerUser()
    await api().post('/auth/forgot-password').send({ email })

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const [reset] = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id)).limit(1)

    const res = await api()
      .post('/auth/verify-code')
      .send({ email, code: reset.code })

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('token')

    const decoded = jwt.decode(res.body.data.token) as any
    expect(decoded).toHaveProperty('userId', user.id)
    expect(decoded).toHaveProperty('purpose', 'reset-password')
  })

  it('400: código incorreto → incrementa tentativas', async () => {
    const email = await registerUser()
    await api().post('/auth/forgot-password').send({ email })

    const res = await api()
      .post('/auth/verify-code')
      .send({ email, code: '000000' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const [reset] = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id)).limit(1)
    expect(reset.attempts).toBe(1)
  })

  it('400: código expira após 3 tentativas malsucedidas', async () => {
    const email = await registerUser()
    await api().post('/auth/forgot-password').send({ email })

    for (let i = 0; i < 3; i++) {
      const res = await api()
        .post('/auth/verify-code')
        .send({ email, code: '000000' })
      expect(res.status).toBe(400)
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const [reset] = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id)).limit(1)
    expect(reset.statusCode).toBe('expired')

    const resCorrect = await api()
      .post('/auth/verify-code')
      .send({ email, code: reset.code })
    expect(resCorrect.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────
// POST /auth/reset-password
// ─────────────────────────────────────────────────────

describe('POST /auth/reset-password', () => {
  it('200: redefinição com token temporário válido', async () => {
    const email = await registerUser()
    await api().post('/auth/forgot-password').send({ email })

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const [reset] = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id)).limit(1)

    const verifyRes = await api()
      .post('/auth/verify-code')
      .send({ email, code: reset.code })

    const { token } = verifyRes.body.data

    const res = await api()
      .post('/auth/reset-password')
      .send({ token, newPassword: 'novasenha123' })

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('message')

    const loginRes = await api().post('/auth/login').send({
      email,
      password: 'novasenha123',
    })
    expect(loginRes.status).toBe(200)

    const [updatedReset] = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id)).limit(1)
    expect(updatedReset.statusCode).toBe('used')
  })

  it('400: recusa redefinição com token inválido/adulterado', async () => {
    const res = await api()
      .post('/auth/reset-password')
      .send({ token: 'token-invalido', newPassword: 'novasenha123' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})
