import { api } from './helpers/app'
import { clearTables, testDb } from './helpers/db'
import * as schema from '@finapp/db'

const VALID_USER = {
  name: 'Ana Teste',
  email: 'ana@teste.com',
  password: 'senha123',
}

async function registerAndLogin(overrides = {}) {
  await api().post('/auth/register').send({ ...VALID_USER, ...overrides })
  const res = await api().post('/auth/login').send({
    email: (overrides as any).email ?? VALID_USER.email,
    password: (overrides as any).password ?? VALID_USER.password,
  })
  return res.body.data.token as string
}

async function insertCategory(userId: string, name: string, color = '#C07830') {
  const [cat] = await testDb
    .insert(schema.categories)
    .values({ userId, name, color })
    .returning()
  return cat
}

import jwt from 'jsonwebtoken'
function userIdFromToken(token: string) {
  return (jwt.decode(token) as { userId: string }).userId
}

beforeEach(async () => {
  await clearTables()
})

// ─────────────────────────────────────────────────────
// GET /categories
// ─────────────────────────────────────────────────────

describe('GET /categories', () => {
  it('401: sem token', async () => {
    const res = await api().get('/categories')
    expect(res.status).toBe(401)
  })

  it('200: retorna lista vazia quando usuário não tem categorias', async () => {
    const token = await registerAndLogin()
    const res = await api().get('/categories').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('200: retorna apenas as categorias do usuário autenticado', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    await insertCategory(userId, 'Alimentação', '#C07830')
    await insertCategory(userId, 'Transporte', '#3B5DA0')

    const token2 = await registerAndLogin({ email: 'outro@teste.com' })
    const userId2 = userIdFromToken(token2)
    await insertCategory(userId2, 'Lazer', '#6B4EA0')

    const res = await api().get('/categories').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.data.every((c: any) => c.userId === undefined)).toBe(true)
  })

  it('retorna id, name, color, icon de cada categoria', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
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

// ─────────────────────────────────────────────────────
// POST /categories
// ─────────────────────────────────────────────────────

describe('POST /categories', () => {
  it('401: sem token', async () => {
    const res = await api().post('/categories').send({ name: 'Teste' })
    expect(res.status).toBe(401)
  })

  it('400: sem nome', async () => {
    const token = await registerAndLogin()
    const res = await api()
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ color: '#aabbcc' })
    expect(res.status).toBe(400)
  })

  it('201: cria categoria com nome e color', async () => {
    const token = await registerAndLogin()
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
    const token = await registerAndLogin()
    const res = await api()
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Outros' })
    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('Outros')
  })
})
