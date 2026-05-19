import jwt from 'jsonwebtoken'
import { api } from './helpers/app'
import { clearTables } from './helpers/db'

const VALID_USER = {
  name: 'Maria Teste',
  email: 'maria@teste.com',
  password: 'senha123',
}

const VALID_CREDIT_CARD = {
  name: 'Roxinho',
  bank: 'Nubank',
  type: 'credit',
  lastFour: '4218',
  holder: 'MARIA TESTE',
  expiry: '08/29',
  creditLimit: 8500,
  closingDay: 16,
  dueDay: 23,
  gradientFrom: '#6B2D8C',
  gradientTo: '#3B0F66',
  accent: '#C77BF0',
}

const VALID_DEBIT_CARD = {
  name: 'Conta',
  bank: 'Itaú',
  type: 'debit',
  lastFour: '7740',
  holder: 'MARIA TESTE',
  expiry: '11/28',
  gradientFrom: '#F7610B',
  gradientTo: '#C44400',
  accent: '#FFFFFF',
}

async function registerAndLogin(overrides = {}) {
  await api().post('/auth/register').send({ ...VALID_USER, ...overrides })
  const res = await api().post('/auth/login').send({
    email: (overrides as any).email ?? VALID_USER.email,
    password: (overrides as any).password ?? VALID_USER.password,
  })
  return res.body.data.token as string
}

beforeEach(async () => {
  await clearTables()
})

// ─────────────────────────────────────────────────────
// GET /cards
// ─────────────────────────────────────────────────────

describe('GET /cards', () => {
  it('401: sem token', async () => {
    const res = await api().get('/cards')
    expect(res.status).toBe(401)
  })

  it('401: token inválido', async () => {
    const res = await api().get('/cards').set('Authorization', 'Bearer token-invalido')
    expect(res.status).toBe(401)
  })

  it('200: lista vazia quando usuário não tem cartões', async () => {
    const token = await registerAndLogin()
    const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('retorna apenas cartões do usuário autenticado', async () => {
    const token1 = await registerAndLogin()
    const token2 = await registerAndLogin({ name: 'Pedro', email: 'pedro@teste.com' })

    await api().post('/cards').set('Authorization', `Bearer ${token1}`).send(VALID_CREDIT_CARD)
    await api().post('/cards').set('Authorization', `Bearer ${token2}`).send(VALID_DEBIT_CARD)

    const res = await api().get('/cards').set('Authorization', `Bearer ${token1}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].name).toBe(VALID_CREDIT_CARD.name)
  })

  it('campos calculados presentes: used, currentMonthTotal, bestPurchaseDay', async () => {
    const token = await registerAndLogin()
    await api().post('/cards').set('Authorization', `Bearer ${token}`).send(VALID_CREDIT_CARD)

    const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    const card = res.body.data[0]
    expect(card).toHaveProperty('used')
    expect(card).toHaveProperty('currentMonthTotal')
    expect(card).toHaveProperty('bestPurchaseDay')
  })

  it('openInstallmentsCount e openInstallmentsTotal são zero', async () => {
    const token = await registerAndLogin()
    await api().post('/cards').set('Authorization', `Bearer ${token}`).send(VALID_CREDIT_CARD)

    const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
    const card = res.body.data[0]
    expect(card.openInstallmentsCount).toBe(0)
    expect(card.openInstallmentsTotal).toBe(0)
  })

  it('cartão de crédito retorna limit, closingDay e dueDay preenchidos', async () => {
    const token = await registerAndLogin()
    await api().post('/cards').set('Authorization', `Bearer ${token}`).send(VALID_CREDIT_CARD)

    const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
    const card = res.body.data[0]
    expect(card.limit).toBe(8500)
    expect(card.closingDay).toBe(16)
    expect(card.dueDay).toBe(23)
  })

  it('cartão de débito retorna limit, closingDay e dueDay nulos', async () => {
    const token = await registerAndLogin()
    await api().post('/cards').set('Authorization', `Bearer ${token}`).send(VALID_DEBIT_CARD)

    const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
    const card = res.body.data[0]
    expect(card.limit).toBeNull()
    expect(card.closingDay).toBeNull()
    expect(card.dueDay).toBeNull()
  })

  it('gradientColors é array com dois itens', async () => {
    const token = await registerAndLogin()
    await api().post('/cards').set('Authorization', `Bearer ${token}`).send(VALID_CREDIT_CARD)

    const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
    const card = res.body.data[0]
    expect(Array.isArray(card.gradientColors)).toBe(true)
    expect(card.gradientColors).toHaveLength(2)
  })
})

// ─────────────────────────────────────────────────────
// POST /cards
// ─────────────────────────────────────────────────────

describe('POST /cards', () => {
  it('401: sem token', async () => {
    const res = await api().post('/cards').send(VALID_CREDIT_CARD)
    expect(res.status).toBe(401)
  })

  it('400: body vazio', async () => {
    const token = await registerAndLogin()
    const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({})
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('201: cria cartão de crédito válido', async () => {
    const token = await registerAndLogin()
    const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(VALID_CREDIT_CARD)
    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty('id')
    expect(res.body.data.name).toBe(VALID_CREDIT_CARD.name)
  })

  it('201: cria cartão de débito (sem creditLimit, closingDay, dueDay)', async () => {
    const token = await registerAndLogin()
    const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(VALID_DEBIT_CARD)
    expect(res.status).toBe(201)
    expect(res.body.data.type).toBe('debit')
  })

  it('400: type inválido', async () => {
    const token = await registerAndLogin()
    const res = await api()
      .post('/cards')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...VALID_CREDIT_CARD, type: 'savings' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('nunca expõe userId na resposta', async () => {
    const token = await registerAndLogin()
    const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(VALID_CREDIT_CARD)
    expect(res.body.data).not.toHaveProperty('userId')
    expect(res.body.data).not.toHaveProperty('user_id')
  })
})
