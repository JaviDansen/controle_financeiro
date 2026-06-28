import jwt from 'jsonwebtoken'
import { api } from './helpers/app'
import { clearTables } from './helpers/db'
import { db, passwordResets, users } from '@finapp/db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const VALID_USER = {
  name: 'João Teste',
  email: 'joao@teste.com',
  password: 'senha123',
}

async function registerUser(overrides = {}) {
  return api().post('/auth/register').send({ ...VALID_USER, ...overrides })
}

async function createUserAndLogin() {
  await registerUser()
  return api().post('/auth/login').send({
    email: VALID_USER.email,
    password: VALID_USER.password,
  })
}

beforeEach(async () => {
  await clearTables()
})

// ─────────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('201: cria usuário com dados válidos', async () => {
    const res = await registerUser()
    expect(res.status).toBe(201)
  })

  it('retorna id, name, email e createdAt do usuário criado', async () => {
    const res = await registerUser()
    expect(res.body.data).toHaveProperty('id')
    expect(res.body.data).toHaveProperty('name', VALID_USER.name)
    expect(res.body.data).toHaveProperty('email', VALID_USER.email)
    expect(res.body.data).toHaveProperty('createdAt')
  })

  it('nunca expõe passwordHash na resposta', async () => {
    const res = await registerUser()
    expect(res.body.data).not.toHaveProperty('passwordHash')
    expect(res.body.data).not.toHaveProperty('password_hash')
    expect(res.body.data).not.toHaveProperty('password')
  })

  it('409: email já cadastrado', async () => {
    await registerUser()
    const res = await registerUser()
    expect(res.status).toBe(409)
    expect(res.body).toHaveProperty('error')
  })

  it('400: name ausente', async () => {
    const res = await registerUser({ name: undefined })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: name sem sobrenome', async () => {
    const res = await registerUser({ name: 'João' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
  
  it('400: email ausente', async () => {
    const res = await registerUser({ email: undefined })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: password ausente', async () => {
    const res = await registerUser({ password: undefined })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: email com formato inválido', async () => {
    const res = await registerUser({ email: 'nao-é-um-email' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: password com menos de 8 caracteres', async () => {
    const res = await registerUser({ password: '1234567' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

// ─────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('200: retorna token JWT com credenciais válidas', async () => {
    const res = await createUserAndLogin()
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('token')
  })

  it('token retornado tem formato JWT (três partes separadas por ponto)', async () => {
    const res = await createUserAndLogin()
    const parts = res.body.data.token.split('.')
    expect(parts).toHaveLength(3)
  })

  it('payload do JWT contém userId', async () => {
    const res = await createUserAndLogin()
    const payload = jwt.decode(res.body.data.token) as { userId?: string }
    expect(payload).toHaveProperty('userId')
    expect(typeof payload.userId).toBe('string')
  })

  it('retorna dados do usuário junto com o token', async () => {
    const res = await createUserAndLogin()
    expect(res.body.data.user).toHaveProperty('id')
    expect(res.body.data.user).toHaveProperty('name', VALID_USER.name)
    expect(res.body.data.user).toHaveProperty('email', VALID_USER.email)
  })

  it('nunca expõe passwordHash na resposta de login', async () => {
    const res = await createUserAndLogin()
    expect(res.body.data.user).not.toHaveProperty('passwordHash')
    expect(res.body.data.user).not.toHaveProperty('password_hash')
    expect(res.body.data.user).not.toHaveProperty('password')
  })

  it('401: senha incorreta', async () => {
    await registerUser()
    const res = await api().post('/auth/login').send({
      email: VALID_USER.email,
      password: 'senha-errada',
    })
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('401: email não cadastrado', async () => {
    const res = await api().post('/auth/login').send({
      email: 'nao-existe@teste.com',
      password: 'qualquer',
    })
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('400: email ausente', async () => {
    const res = await api().post('/auth/login').send({ password: 'senha123' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: password ausente', async () => {
    const res = await api().post('/auth/login').send({ email: VALID_USER.email })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

// ─────────────────────────────────────────────────────
// POST /auth/forgot-password
// ─────────────────────────────────────────────────────

describe('POST /auth/forgot-password', () => {
  it('200: email cadastrado → confirma solicitação e cria código no banco', async () => {
    await registerUser()
    const res = await api()
      .post('/auth/forgot-password')
      .send({ email: VALID_USER.email })
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('message')

    // Verifica inserção no banco
    const [user] = await db.select().from(users).where(eq(users.email, VALID_USER.email)).limit(1)
    const resets = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id))
    expect(resets).toHaveLength(1)
    expect(resets[0].code).toHaveLength(6)
    expect(resets[0].statusCode).toBe('pending')
  })

  it('200: email NÃO cadastrado → mesma resposta (não revela se existe)', async () => {
    const res = await api()
      .post('/auth/forgot-password')
      .send({ email: 'nao-existe@teste.com' })
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('message')
  })

  it('400: email ausente', async () => {
    const res = await api().post('/auth/forgot-password').send({})
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: email com formato inválido', async () => {
    const res = await api()
      .post('/auth/forgot-password')
      .send({ email: 'nao-é-email' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

// ─────────────────────────────────────────────────────
// POST /auth/verify-code
// ─────────────────────────────────────────────────────

describe('POST /auth/verify-code', () => {
  it('200: código correto → retorna token JWT temporário', async () => {
    await registerUser()
    await api().post('/auth/forgot-password').send({ email: VALID_USER.email })

    const [user] = await db.select().from(users).where(eq(users.email, VALID_USER.email)).limit(1)
    const [reset] = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id)).limit(1)

    const res = await api()
      .post('/auth/verify-code')
      .send({ email: VALID_USER.email, code: reset.code })

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('token')

    const decoded = jwt.decode(res.body.data.token) as any
    expect(decoded).toHaveProperty('userId', user.id)
    expect(decoded).toHaveProperty('purpose', 'reset-password')
  })

  it('400: código incorreto → incrementa tentativas', async () => {
    await registerUser()
    await api().post('/auth/forgot-password').send({ email: VALID_USER.email })

    const res = await api()
      .post('/auth/verify-code')
      .send({ email: VALID_USER.email, code: '000000' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')

    const [user] = await db.select().from(users).where(eq(users.email, VALID_USER.email)).limit(1)
    const [reset] = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id)).limit(1)
    expect(reset.attempts).toBe(1)
  })

  it('400: código expira após 3 tentativas malsucedidas', async () => {
    await registerUser()
    await api().post('/auth/forgot-password').send({ email: VALID_USER.email })

    for (let i = 0; i < 3; i++) {
      const res = await api()
        .post('/auth/verify-code')
        .send({ email: VALID_USER.email, code: '000000' })
      expect(res.status).toBe(400)
    }

    const [user] = await db.select().from(users).where(eq(users.email, VALID_USER.email)).limit(1)
    const [reset] = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id)).limit(1)
    expect(reset.statusCode).toBe('expired')

    const resCorrect = await api()
      .post('/auth/verify-code')
      .send({ email: VALID_USER.email, code: reset.code })
    expect(resCorrect.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────
// POST /auth/reset-password
// ─────────────────────────────────────────────────────

describe('POST /auth/reset-password', () => {
  it('200: redefinição com token temporário válido', async () => {
    await registerUser()
    await api().post('/auth/forgot-password').send({ email: VALID_USER.email })

    const [user] = await db.select().from(users).where(eq(users.email, VALID_USER.email)).limit(1)
    const [reset] = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id)).limit(1)

    const verifyRes = await api()
      .post('/auth/verify-code')
      .send({ email: VALID_USER.email, code: reset.code })

    const { token } = verifyRes.body.data

    const res = await api()
      .post('/auth/reset-password')
      .send({ token, newPassword: 'novasenha123' })

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('message')

    const loginRes = await api().post('/auth/login').send({
      email: VALID_USER.email,
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
