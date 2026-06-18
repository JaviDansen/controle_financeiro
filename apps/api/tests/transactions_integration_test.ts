import { api } from './helpers/app'
import { clearTables, testDb } from './helpers/db'
import * as schema from '@finapp/db'

const VALID_USER = {
  name: 'Maria Teste',
  email: 'maria@teste.com',
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

async function createCategory(userId: string, name = 'Alimentação') {
  const [cat] = await testDb
    .insert(schema.categories)
    .values({ userId, name })
    .returning({ id: schema.categories.id })
  return cat.id
}

async function createCard(token: string) {
  const res = await api()
    .post('/cards')
    .set('Authorization', `Bearer ${token}`)
    .send({
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
    })
  return res.body.data.id as string
}

import jwt from 'jsonwebtoken'

function userIdFromToken(token: string) {
  return (jwt.decode(token) as { userId: string }).userId
}

beforeEach(async () => {
  await clearTables()
})

// ─────────────────────────────────────────────────────
// GET /transactions
// ─────────────────────────────────────────────────────

describe('GET /transactions', () => {
  it('401: sem token', async () => {
    const res = await api().get('/transactions').query({ month: '2026-06' })
    expect(res.status).toBe(401)
  })

  it('401: token inválido', async () => {
    const res = await api()
      .get('/transactions')
      .set('Authorization', 'Bearer token-invalido')
      .query({ month: '2026-06' })
    expect(res.status).toBe(401)
  })

  it('400: sem parâmetro month', async () => {
    const token = await registerAndLogin()
    const res = await api()
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: month com formato inválido', async () => {
    const token = await registerAndLogin()
    const res = await api()
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .query({ month: '06-2026' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('200: lista vazia quando usuário não tem transações no mês', async () => {
    const token = await registerAndLogin()
    const res = await api()
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .query({ month: '2026-06' })
    expect(res.status).toBe(200)
    expect(res.body.data.transactions).toEqual([])
  })

  it('200: summary zerado quando não há transações', async () => {
    const token = await registerAndLogin()
    const res = await api()
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .query({ month: '2026-06' })
    expect(res.status).toBe(200)
    expect(res.body.data.summary.income).toBe(0)
    expect(res.body.data.summary.expense).toBe(0)
    expect(res.body.data.summary.balance).toBe(0)
    expect(res.body.data.summary.month).toBe('2026-06')
  })

  it('200: retorna transações do mês correto', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    await testDb.insert(schema.transactions).values({
      userId,
      categoryId,
      title: 'Salário',
      amount: '5800.00',
      type: 'income',
      date: '2026-06-14',
      isRecurring: false,
    })

    const res = await api()
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .query({ month: '2026-06' })

    expect(res.status).toBe(200)
    expect(res.body.data.transactions).toHaveLength(1)
    expect(res.body.data.transactions[0].title).toBe('Salário')
  })

  it('não retorna transações de outro mês', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    await testDb.insert(schema.transactions).values({
      userId,
      categoryId,
      title: 'Salário maio',
      amount: '5800.00',
      type: 'income',
      date: '2026-05-14',
      isRecurring: false,
    })

    const res = await api()
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .query({ month: '2026-06' })

    expect(res.status).toBe(200)
    expect(res.body.data.transactions).toHaveLength(0)
  })

  it('não retorna transações de outro usuário', async () => {
    const token1 = await registerAndLogin()
    const token2 = await registerAndLogin({ name: 'Pedro Silva', email: 'pedro@teste.com' })
    const userId2 = userIdFromToken(token2)
    const categoryId = await createCategory(userId2)

    await testDb.insert(schema.transactions).values({
      userId: userId2,
      categoryId,
      title: 'Transação do Pedro',
      amount: '500.00',
      type: 'expense',
      date: '2026-06-10',
      isRecurring: false,
    })

    const res = await api()
      .get('/transactions')
      .set('Authorization', `Bearer ${token1}`)
      .query({ month: '2026-06' })

    expect(res.status).toBe(200)
    expect(res.body.data.transactions).toHaveLength(0)
  })

  it('summary calcula income, expense e balance corretamente', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    await testDb.insert(schema.transactions).values([
      { userId, categoryId, title: 'Salário', amount: '5800.00', type: 'income', date: '2026-06-14', isRecurring: false },
      { userId, categoryId, title: 'Aluguel', amount: '1850.00', type: 'expense', date: '2026-06-13', isRecurring: false },
      { userId, categoryId, title: 'Mercado', amount: '312.47', type: 'expense', date: '2026-06-12', isRecurring: false },
    ])

    const res = await api()
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .query({ month: '2026-06' })

    expect(res.status).toBe(200)
    const { summary } = res.body.data
    expect(summary.income).toBe(5800)
    expect(summary.expense).toBe(2162.47)
    expect(summary.balance).toBe(3637.53)
  })

  it('transação retorna campos obrigatórios do contrato', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    await testDb.insert(schema.transactions).values({
      userId,
      categoryId,
      title: 'Salário',
      amount: '5800.00',
      type: 'income',
      date: '2026-06-14',
      isRecurring: false,
    })

    const res = await api()
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .query({ month: '2026-06' })

    const tx = res.body.data.transactions[0]
    expect(tx).toHaveProperty('id')
    expect(tx).toHaveProperty('title')
    expect(tx).toHaveProperty('amount')
    expect(tx).toHaveProperty('type')
    expect(tx).toHaveProperty('categoryId')
    expect(tx).toHaveProperty('categoryName')
    expect(tx).toHaveProperty('categoryColor')
    expect(tx).toHaveProperty('cardId')
    expect(tx).toHaveProperty('date')
    expect(tx).toHaveProperty('notes')
    expect(tx).toHaveProperty('isRecurring')
    expect(tx).toHaveProperty('createdAt')
  })

  it('nunca expõe userId na lista de transações', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    await testDb.insert(schema.transactions).values({
      userId,
      categoryId,
      title: 'Salário',
      amount: '5800.00',
      type: 'income',
      date: '2026-06-14',
      isRecurring: false,
    })

    const res = await api()
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .query({ month: '2026-06' })

    const tx = res.body.data.transactions[0]
    expect(tx).not.toHaveProperty('userId')
    expect(tx).not.toHaveProperty('user_id')
  })
})

// ─────────────────────────────────────────────────────
// POST /transactions
// ─────────────────────────────────────────────────────

describe('POST /transactions', () => {
  it('401: sem token', async () => {
    const res = await api().post('/transactions').send({})
    expect(res.status).toBe(401)
  })

  it('400: body vazio', async () => {
    const token = await registerAndLogin()
    const res = await api()
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({})
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('201: cria transação de receita sem cardId', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    const res = await api()
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Salário',
        amount: 5800,
        type: 'income',
        categoryId,
        cardId: null,
        date: '2026-06-14',
        notes: 'Mensal',
        isRecurring: false,
      })

    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty('id')
    expect(res.body.data.title).toBe('Salário')
    expect(res.body.data.amount).toBe(5800)
    expect(res.body.data.type).toBe('income')
  })

  it('201: cria transação de despesa com cardId', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)
    const cardId = await createCard(token)

    const res = await api()
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Mercado',
        amount: 312.47,
        type: 'expense',
        categoryId,
        cardId,
        date: '2026-06-12',
        notes: '',
        isRecurring: false,
      })

    expect(res.status).toBe(201)
    expect(res.body.data.cardId).toBe(cardId)
    expect(res.body.data.type).toBe('expense')
  })

  it('400: amount negativo', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    const res = await api()
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Salário',
        amount: -100,
        type: 'income',
        categoryId,
        cardId: null,
        date: '2026-06-14',
        isRecurring: false,
      })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('400: type inválido', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    const res = await api()
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Teste',
        amount: 100,
        type: 'transfer',
        categoryId,
        cardId: null,
        date: '2026-06-14',
        isRecurring: false,
      })

    expect(res.status).toBe(400)
  })

  it('400: date com formato inválido', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    const res = await api()
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Teste',
        amount: 100,
        type: 'income',
        categoryId,
        cardId: null,
        date: '14/06/2026',
        isRecurring: false,
      })

    expect(res.status).toBe(400)
  })

  it('400: title ausente', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    const res = await api()
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 100,
        type: 'income',
        categoryId,
        cardId: null,
        date: '2026-06-14',
        isRecurring: false,
      })

    expect(res.status).toBe(400)
  })

  it('nunca expõe userId na resposta do POST', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    const res = await api()
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Salário',
        amount: 5800,
        type: 'income',
        categoryId,
        cardId: null,
        date: '2026-06-14',
        isRecurring: false,
      })

    expect(res.body.data).not.toHaveProperty('userId')
    expect(res.body.data).not.toHaveProperty('user_id')
  })
})

// ─────────────────────────────────────────────────────
// PUT /transactions/:id
// ─────────────────────────────────────────────────────

describe('PUT /transactions/:id', () => {
  it('401: sem token', async () => {
    const res = await api().put('/transactions/id-qualquer').send({ title: 'Novo' })
    expect(res.status).toBe(401)
  })

  it('404: transação não existe', async () => {
    const token = await registerAndLogin()
    const res = await api()
      .put('/transactions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Novo' })
    expect(res.status).toBe(404)
  })

  it('404: não pode editar transação de outro usuário', async () => {
    const token1 = await registerAndLogin()
    const token2 = await registerAndLogin({ name: 'Pedro Silva', email: 'pedro@teste.com' })
    const userId2 = userIdFromToken(token2)
    const categoryId = await createCategory(userId2)

    const [tx] = await testDb
      .insert(schema.transactions)
      .values({
        userId: userId2,
        categoryId,
        title: 'Transação do Pedro',
        amount: '500.00',
        type: 'expense',
        date: '2026-06-10',
        isRecurring: false,
      })
      .returning({ id: schema.transactions.id })

    const res = await api()
      .put(`/transactions/${tx.id}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: 'Tentativa de edição' })

    expect(res.status).toBe(404)
  })

  it('200: atualiza title corretamente', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    const [tx] = await testDb
      .insert(schema.transactions)
      .values({
        userId,
        categoryId,
        title: 'Título antigo',
        amount: '100.00',
        type: 'expense',
        date: '2026-06-10',
        isRecurring: false,
      })
      .returning({ id: schema.transactions.id })

    const res = await api()
      .put(`/transactions/${tx.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Título novo' })

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Título novo')
  })
})

// ─────────────────────────────────────────────────────
// DELETE /transactions/:id
// ─────────────────────────────────────────────────────

describe('DELETE /transactions/:id', () => {
  it('401: sem token', async () => {
    const res = await api().delete('/transactions/id-qualquer')
    expect(res.status).toBe(401)
  })

  it('404: transação não existe', async () => {
    const token = await registerAndLogin()
    const res = await api()
      .delete('/transactions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })

  it('404: não pode deletar transação de outro usuário', async () => {
    const token1 = await registerAndLogin()
    const token2 = await registerAndLogin({ name: 'Pedro Silva', email: 'pedro@teste.com' })
    const userId2 = userIdFromToken(token2)
    const categoryId = await createCategory(userId2)

    const [tx] = await testDb
      .insert(schema.transactions)
      .values({
        userId: userId2,
        categoryId,
        title: 'Transação do Pedro',
        amount: '500.00',
        type: 'expense',
        date: '2026-06-10',
        isRecurring: false,
      })
      .returning({ id: schema.transactions.id })

    const res = await api()
      .delete(`/transactions/${tx.id}`)
      .set('Authorization', `Bearer ${token1}`)

    expect(res.status).toBe(404)
  })

  it('204: deleta transação própria', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    const [tx] = await testDb
      .insert(schema.transactions)
      .values({
        userId,
        categoryId,
        title: 'A deletar',
        amount: '50.00',
        type: 'expense',
        date: '2026-06-10',
        isRecurring: false,
      })
      .returning({ id: schema.transactions.id })

    const res = await api()
      .delete(`/transactions/${tx.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
  })

  it('transação deletada não aparece no GET do mês', async () => {
    const token = await registerAndLogin()
    const userId = userIdFromToken(token)
    const categoryId = await createCategory(userId)

    const [tx] = await testDb
      .insert(schema.transactions)
      .values({
        userId,
        categoryId,
        title: 'A deletar',
        amount: '50.00',
        type: 'expense',
        date: '2026-06-10',
        isRecurring: false,
      })
      .returning({ id: schema.transactions.id })

    await api()
      .delete(`/transactions/${tx.id}`)
      .set('Authorization', `Bearer ${token}`)

    const res = await api()
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .query({ month: '2026-06' })

    expect(res.body.data.transactions).toHaveLength(0)
  })
})
