import jwt from 'jsonwebtoken'
import { api } from './helpers/app'
import { clearTables } from './helpers/db'

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

  it('400: password com menos de 6 caracteres', async () => {
    const res = await registerUser({ password: '123' })
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
  it('200: email cadastrado → confirma solicitação', async () => {
    await registerUser()
    const res = await api()
      .post('/auth/forgot-password')
      .send({ email: VALID_USER.email })
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('message')
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
