import jwt from 'jsonwebtoken'
import { api } from './helpers/app'
import { testDb } from './helpers/db'
import * as schema from '@finapp/db'

const VALID_USER = {
  name: 'Ana Teste',
  email: 'ana@teste.com',
  password: 'senha123',
}

let userSeq = 0
function uniqueEmail(email: string) {
  userSeq += 1
  const [local, domain] = email.split('@')
  return `${local}+${Date.now()}-${userSeq}@${domain}`
}

async function registerAndLogin(overrides = {}) {
  const user = { ...VALID_USER, ...overrides } as typeof VALID_USER
  user.email = uniqueEmail(user.email)
  await api().post('/auth/register').send(user)
  const res = await api().post('/auth/login').send({ email: user.email, password: user.password })
  return res.body.data.token as string
}

function userIdFromToken(token: string) {
  return (jwt.decode(token) as { userId: string }).userId
}

async function insertCategory(userId: string, name: string, color = '#C07830') {
  const [cat] = await testDb
    .insert(schema.categories)
    .values({ userId, name, color })
    .returning()
  return cat
}

// ─────────────────────────────────────────────────────
// GET /categories
// ─────────────────────────────────────────────────────

describe('GET /categories', () => {
  it('401: sem token', async () => {
    const res = await api().get('/categories')
    expect(res.status).toBe(401)
  })

  describe('com usuário autenticado', () => {
    let token: string
    let userId: string

    beforeAll(async () => {
      token = await registerAndLogin()
      userId = userIdFromToken(token)
    })

    it('200: retorna lista vazia quando usuário não tem categorias', async () => {
      const res = await api().get('/categories').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })

    it('retorna id, name, color, icon de cada categoria', async () => {
      await insertCategory(userId, 'Saúde', '#B04040')
      const res = await api().get('/categories').set('Authorization', `Bearer ${token}`)
      const cat = res.body.data[0]
      expect(cat).toHaveProperty('id')
      expect(cat).toHaveProperty('name', 'Saúde')
      expect(cat).toHaveProperty('color', '#B04040')
      expect(cat).toHaveProperty('icon')
      expect(cat).not.toHaveProperty('userId')
    })
  })

  describe('isolamento entre usuários', () => {
    let token1: string
    let userId1: string
    let token2: string
    let userId2: string

    beforeAll(async () => {
      token1 = await registerAndLogin()
      userId1 = userIdFromToken(token1)
      token2 = await registerAndLogin({ email: 'outro@teste.com' })
      userId2 = userIdFromToken(token2)
    })

    it('200: retorna apenas as categorias do usuário autenticado', async () => {
      await insertCategory(userId1, 'Alimentação', '#C07830')
      await insertCategory(userId1, 'Transporte', '#3B5DA0')
      await insertCategory(userId2, 'Lazer', '#6B4EA0')

      const res = await api().get('/categories').set('Authorization', `Bearer ${token1}`)
      expect(res.status).toBe(200)
      const userCats = res.body.data.filter((c: any) => c.name === 'Alimentação' || c.name === 'Transporte')
      expect(userCats).toHaveLength(2)
      expect(res.body.data.every((c: any) => c.userId === undefined)).toBe(true)
    })
  })
})

// ─────────────────────────────────────────────────────
// POST /categories
// ─────────────────────────────────────────────────────

describe('POST /categories', () => {
  let token: string

  beforeAll(async () => {
    token = await registerAndLogin()
  })

  it('401: sem token', async () => {
    const res = await api().post('/categories').send({ name: 'Teste' })
    expect(res.status).toBe(401)
  })

  it('400: sem nome', async () => {
    const res = await api()
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ color: '#aabbcc' })
    expect(res.status).toBe(400)
  })

  it('201: cria categoria com nome e color', async () => {
    const res = await api()
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Freelance', color: '#2E7A8A' })
    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty('id')
    expect(res.body.data.name).toBe('Freelance')
    expect(res.body.data.color).toBe('#2E7A8A')
    expect(res.body.data).not.toHaveProperty('userId')
  })

  it('201: cria categoria somente com nome (color e icon opcionais)', async () => {
    const res = await api()
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Outros' })
    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('Outros')
  })
})
