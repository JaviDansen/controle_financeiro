import jwt from 'jsonwebtoken'
import { api } from './helpers/app'
import { testDb } from './helpers/db'
import * as schema from '@finapp/db'

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

async function insertTransactionForCard(userId: string, cardId: string, amount: number) {
  const [cat] = await testDb
    .insert(schema.categories)
    .values({ userId, name: 'Teste' })
    .returning({ id: schema.categories.id })
  const today = new Date().toISOString().slice(0, 10)
  await testDb.insert(schema.transactions).values({
    userId, categoryId: cat.id, cardId, title: 'Transação teste',
    amount: String(amount), type: 'expense', date: today, isRecurring: false,
  })
}

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

  describe('com usuário autenticado', () => {
    let token: string
    let userId: string

    beforeAll(async () => {
      token = await registerAndLogin()
      userId = userIdFromToken(token)
    })

    it('200: lista vazia quando usuário não tem cartões', async () => {
      const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(res.body.data).toEqual([])
    })

    it('campos calculados presentes: used, currentMonthTotal, bestPurchaseDate', async () => {
      await api().post('/cards').set('Authorization', `Bearer ${token}`).send(VALID_CREDIT_CARD)
      const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
      const card = res.body.data[0]
      expect(card).toHaveProperty('used')
      expect(card).toHaveProperty('currentMonthTotal')
      expect(card).toHaveProperty('bestPurchaseDate')
    })

    it('openInstallmentsCount e openInstallmentsTotal são zero', async () => {
      const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
      const card = res.body.data[0]
      expect(card.openInstallmentsCount).toBe(0)
      expect(card.openInstallmentsTotal).toBe(0)
    })

    it('cartão de crédito retorna limit, closingDay e dueDay preenchidos', async () => {
      const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
      const card = res.body.data.find((c: any) => c.type === 'credit')
      expect(card.limit).toBe(8500)
      expect(card.closingDay).toBe(16)
      expect(card.dueDay).toBe(23)
    })

    it('cartão de débito retorna limit, closingDay e dueDay nulos', async () => {
      await api().post('/cards').set('Authorization', `Bearer ${token}`).send(VALID_DEBIT_CARD)
      const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
      const card = res.body.data.find((c: any) => c.type === 'debit')
      expect(card.limit).toBeNull()
      expect(card.closingDay).toBeNull()
      expect(card.dueDay).toBeNull()
    })

    it('gradientColors é array com dois itens', async () => {
      const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
      const card = res.body.data[0]
      expect(Array.isArray(card.gradientColors)).toBe(true)
      expect(card.gradientColors).toHaveLength(2)
    })

    it('currentMonthTotal reflete transações reais do cartão', async () => {
      const createRes = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, name: 'Para transação' })
      const cardId = createRes.body.data.id
      await insertTransactionForCard(userId, cardId, 250.00)
      const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
      const card = res.body.data.find((c: any) => c.id === cardId)
      expect(res.status).toBe(200)
      expect(card.currentMonthTotal).toBe(250)
    })

    it('used é igual a currentMonthTotal quando há transações no mês', async () => {
      const createRes = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, name: 'Usado' })
      const cardId = createRes.body.data.id
      await insertTransactionForCard(userId, cardId, 180.50)
      const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
      const card = res.body.data.find((c: any) => c.id === cardId)
      expect(card.used).toBe(card.currentMonthTotal)
    })

    it('gradientColors retorna defaults quando gradientFrom e gradientTo não são enviados', async () => {
      const { gradientFrom: _f, gradientTo: _t, ...withoutGradient } = VALID_CREDIT_CARD
      await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...withoutGradient, name: 'Sem gradient' })
      const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
      const card = res.body.data.find((c: any) => c.name === 'Sem gradient')
      expect(res.status).toBe(200)
      expect(card.gradientColors).toEqual(['#15151A', '#0A0A0A'])
    })

    it('usuário com 3 cartões retorna todos sem duplicação', async () => {
      const token3 = await registerAndLogin()
      await api().post('/cards').set('Authorization', `Bearer ${token3}`).send(VALID_CREDIT_CARD)
      await api().post('/cards').set('Authorization', `Bearer ${token3}`).send({ ...VALID_CREDIT_CARD, name: 'Segundo' })
      await api().post('/cards').set('Authorization', `Bearer ${token3}`).send(VALID_DEBIT_CARD)
      const res = await api().get('/cards').set('Authorization', `Bearer ${token3}`)
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(3)
      const ids = res.body.data.map((c: any) => c.id)
      expect(new Set(ids).size).toBe(3)
    })

    it('bestPurchaseDay calculado corretamente com closingDay próximo ao fim do mês', async () => {
      await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, name: 'Card27', closingDay: 27 })
      await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, name: 'Card28', closingDay: 28 })
      const res = await api().get('/cards').set('Authorization', `Bearer ${token}`)
      const card27 = res.body.data.find((c: any) => c.closingDay === 27)
      const card28 = res.body.data.find((c: any) => c.closingDay === 28)
      const now = new Date()
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const expected27 = 30 > daysInMonth ? 30 - daysInMonth : 30
      const expected28 = 31 > daysInMonth ? 31 - daysInMonth : 31
      expect(card27.bestPurchaseDay).toBe(expected27)
      expect(card28.bestPurchaseDay).toBe(expected28)
    })
  })

  describe('isolamento entre usuários', () => {
    let token1: string
    let token2: string

    beforeAll(async () => {
      token1 = await registerAndLogin()
      token2 = await registerAndLogin({ name: 'Pedro Silva', email: 'pedro@teste.com' })
      await api().post('/cards').set('Authorization', `Bearer ${token1}`).send(VALID_CREDIT_CARD)
      await api().post('/cards').set('Authorization', `Bearer ${token2}`).send(VALID_DEBIT_CARD)
    })

    it('retorna apenas cartões do usuário autenticado', async () => {
      const res = await api().get('/cards').set('Authorization', `Bearer ${token1}`)
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].name).toBe(VALID_CREDIT_CARD.name)
    })
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

  describe('com usuário autenticado', () => {
    let token: string

    beforeAll(async () => {
      token = await registerAndLogin()
    })

    it('400: body vazio', async () => {
      const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({})
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('201: cria cartão de crédito válido', async () => {
      const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(VALID_CREDIT_CARD)
      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.name).toBe(VALID_CREDIT_CARD.name)
    })

    it('201: cria cartão de débito (sem creditLimit, closingDay, dueDay)', async () => {
      const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(VALID_DEBIT_CARD)
      expect(res.status).toBe(201)
      expect(res.body.data.type).toBe('debit')
    })

    it('400: type inválido', async () => {
      const res = await api()
        .post('/cards')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...VALID_CREDIT_CARD, type: 'savings' })
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('nunca expõe userId na resposta', async () => {
      const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, name: 'Privado' })
      expect(res.body.data).not.toHaveProperty('userId')
      expect(res.body.data).not.toHaveProperty('user_id')
    })

    it('gradientColors retornado como [string, string] na resposta do POST', async () => {
      const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, name: 'GradTest' })
      expect(res.status).toBe(201)
      expect(Array.isArray(res.body.data.gradientColors)).toBe(true)
      expect(res.body.data.gradientColors).toHaveLength(2)
      res.body.data.gradientColors.forEach((c: any) => expect(typeof c).toBe('string'))
    })

    it('campos de estilo retornados corretamente na resposta do POST', async () => {
      const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, name: 'Style' })
      expect(res.status).toBe(201)
      expect(res.body.data.bank).toBe(VALID_CREDIT_CARD.bank)
      expect(res.body.data.holder).toBe(VALID_CREDIT_CARD.holder)
      expect(res.body.data.expiry).toBe(VALID_CREDIT_CARD.expiry)
      expect(res.body.data.accent).toBe(VALID_CREDIT_CARD.accent)
    })

    it('400: lastFour com comprimento inválido', async () => {
      const res3 = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, lastFour: '123' })
      expect(res3.status).toBe(400)
      const res5 = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, lastFour: '12345' })
      expect(res5.status).toBe(400)
    })

    it('400: creditLimit negativo ou zero', async () => {
      const resNeg = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, creditLimit: -500 })
      expect(resNeg.status).toBe(400)
      const resZero = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, creditLimit: 0 })
      expect(resZero.status).toBe(400)
    })

    it('400: closingDay fora do range 1–31', async () => {
      const resMin = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, closingDay: 0 })
      expect(resMin.status).toBe(400)
      const resMax = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, closingDay: 32 })
      expect(resMax.status).toBe(400)
    })

    it('400: dueDay fora do range 1–31', async () => {
      const resMin = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, dueDay: 0 })
      expect(resMin.status).toBe(400)
      const resMax = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, dueDay: 32 })
      expect(resMax.status).toBe(400)
    })

    it('400: name ausente', async () => {
      const { name: _, ...payload } = VALID_CREDIT_CARD
      const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(payload)
      expect(res.status).toBe(400)
    })

    it('400: bank ausente', async () => {
      const { bank: _, ...payload } = VALID_CREDIT_CARD
      const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(payload)
      expect(res.status).toBe(400)
    })

    it('400: type ausente', async () => {
      const { type: _, ...payload } = VALID_CREDIT_CARD
      const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(payload)
      expect(res.status).toBe(400)
    })

    it('201: cria cartão sem expiry — único campo opcional', async () => {
      const { expiry: _, ...payload } = VALID_CREDIT_CARD
      const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...payload, name: 'Sem expiry' })
      expect(res.status).toBe(201)
      expect(res.body.data.expiry).toBeNull()
    })

    it('creditLimit enviado em cartão de débito é aceito silenciosamente', async () => {
      const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_DEBIT_CARD, creditLimit: 5000 })
      expect(res.status).toBe(201)
      expect(res.body.data.type).toBe('debit')
    })

    it('expiry em formato inválido é aceito sem validação de formato', async () => {
      // Zod valida apenas que é string — formato MM/YY não é verificado. Documentado para eventual correção.
      const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send({ ...VALID_CREDIT_CARD, expiry: '13/99' })
      expect(res.status).toBe(201)
    })
  })
})

// ─────────────────────────────────────────────────────
// POST /cards — campos obrigatórios (pós API-FIX)
// Estes testes FALHAM com a implementação atual (esperado — TDD red phase).
// Passarão após a implementação do API-FIX de validação de campos obrigatórios.
// ─────────────────────────────────────────────────────

describe('POST /cards — campos obrigatórios (pós API-FIX)', () => {
  let token: string

  beforeAll(async () => {
    token = await registerAndLogin()
  })

  it('400: lastFour ausente', async () => {
    const { lastFour: _, ...payload } = VALID_CREDIT_CARD
    const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(payload)
    expect(res.status).toBe(400)
  })

  it('400: holder ausente', async () => {
    const { holder: _, ...payload } = VALID_CREDIT_CARD
    const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(payload)
    expect(res.status).toBe(400)
  })

  it('400: gradientFrom ausente', async () => {
    const { gradientFrom: _, ...payload } = VALID_CREDIT_CARD
    const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(payload)
    expect(res.status).toBe(400)
  })

  it('400: gradientTo ausente', async () => {
    const { gradientTo: _, ...payload } = VALID_CREDIT_CARD
    const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(payload)
    expect(res.status).toBe(400)
  })

  it('400: accent ausente', async () => {
    const { accent: _, ...payload } = VALID_CREDIT_CARD
    const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(payload)
    expect(res.status).toBe(400)
  })

  it('400: creditLimit ausente quando type = credit', async () => {
    const { creditLimit: _, ...payload } = VALID_CREDIT_CARD
    const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(payload)
    expect(res.status).toBe(400)
  })

  it('400: closingDay ausente quando type = credit', async () => {
    const { closingDay: _, ...payload } = VALID_CREDIT_CARD
    const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(payload)
    expect(res.status).toBe(400)
  })

  it('400: dueDay ausente quando type = credit', async () => {
    const { dueDay: _, ...payload } = VALID_CREDIT_CARD
    const res = await api().post('/cards').set('Authorization', `Bearer ${token}`).send(payload)
    expect(res.status).toBe(400)
  })
})
