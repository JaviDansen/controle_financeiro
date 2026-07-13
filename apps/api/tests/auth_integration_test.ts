import jwt from 'jsonwebtoken'
import { api } from './helpers/app'

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

  it('200: email cadastrado → confirma solicitação', async () => {
    const res = await api().post('/auth/forgot-password').send({ email })
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('message')
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
