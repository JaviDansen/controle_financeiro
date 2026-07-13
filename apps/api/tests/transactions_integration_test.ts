import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { api } from './helpers/app'
import { testDb } from './helpers/db'
import * as schema from '@finapp/db'

const VALID_USER = {
  name: 'Maria Teste',
  email: 'maria@teste.com',
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

  describe('validação de parâmetros', () => {
    let token: string

    beforeAll(async () => {
      token = await registerAndLogin()
    })

    it('400: sem parâmetro month', async () => {
      const res = await api().get('/transactions').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('400: month com formato inválido', async () => {
      const res = await api()
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: '06-2026' })
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('200: lista vazia quando usuário não tem transações no mês', async () => {
      const res = await api()
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: '2026-06' })
      expect(res.status).toBe(200)
      expect(res.body.data.transactions).toEqual([])
    })

    it('200: summary zerado quando não há transações', async () => {
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
  })

  describe('leitura de transações', () => {
    let token: string
    let userId: string
    let categoryId: string

    beforeAll(async () => {
      token = await registerAndLogin()
      userId = userIdFromToken(token)
      categoryId = await createCategory(userId)
      await testDb.insert(schema.transactions).values([
        { userId, categoryId, title: 'Salário', amount: '5800.00', type: 'income', date: '2026-06-14', isRecurring: false },
        { userId, categoryId, title: 'Aluguel', amount: '1850.00', type: 'expense', date: '2026-06-13', isRecurring: false },
        { userId, categoryId, title: 'Mercado', amount: '312.47', type: 'expense', date: '2026-06-12', isRecurring: false },
        { userId, categoryId, title: 'Salário maio', amount: '5800.00', type: 'income', date: '2026-05-14', isRecurring: false },
      ])
    })

    it('200: retorna transações do mês correto', async () => {
      const res = await api()
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: '2026-06' })
      expect(res.status).toBe(200)
      const titles = res.body.data.transactions.map((t: any) => t.title)
      expect(titles).toContain('Salário')
    })

    it('não retorna transações de outro mês', async () => {
      const res = await api()
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: '2026-06' })
      expect(res.status).toBe(200)
      const titles = res.body.data.transactions.map((t: any) => t.title)
      expect(titles).not.toContain('Salário maio')
    })

    it('summary calcula income, expense e balance corretamente', async () => {
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
      const res = await api()
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: '2026-06' })
      const tx = res.body.data.transactions[0]
      expect(tx).not.toHaveProperty('userId')
      expect(tx).not.toHaveProperty('user_id')
    })
  })

  describe('isolamento entre usuários', () => {
    let token1: string
    let token2: string
    let userId2: string

    beforeAll(async () => {
      token1 = await registerAndLogin()
      token2 = await registerAndLogin({ name: 'Pedro Silva', email: 'pedro@teste.com' })
      userId2 = userIdFromToken(token2)
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
    })

    it('não retorna transações de outro usuário', async () => {
      const res = await api()
        .get('/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .query({ month: '2026-06' })
      expect(res.status).toBe(200)
      const titles = res.body.data.transactions.map((t: any) => t.title)
      expect(titles).not.toContain('Transação do Pedro')
    })
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

  describe('validação de entrada', () => {
    let token: string
    let categoryId: string

    beforeAll(async () => {
      token = await registerAndLogin()
      const userId = userIdFromToken(token)
      categoryId = await createCategory(userId)
    })

    it('400: body vazio', async () => {
      const res = await api().post('/transactions').set('Authorization', `Bearer ${token}`).send({})
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('400: amount negativo', async () => {
      const res = await api()
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Salário', amount: -100, type: 'income', categoryId, cardId: null, date: '2026-06-14', isRecurring: false })
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('400: type inválido', async () => {
      const res = await api()
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Teste', amount: 100, type: 'transfer', categoryId, cardId: null, date: '2026-06-14', isRecurring: false })
      expect(res.status).toBe(400)
    })

    it('400: date com formato inválido', async () => {
      const res = await api()
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Teste', amount: 100, type: 'income', categoryId, cardId: null, date: '14/06/2026', isRecurring: false })
      expect(res.status).toBe(400)
    })

    it('400: title ausente', async () => {
      const res = await api()
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100, type: 'income', categoryId, cardId: null, date: '2026-06-14', isRecurring: false })
      expect(res.status).toBe(400)
    })
  })

  describe('criação de transações', () => {
    let token: string
    let userId: string
    let categoryId: string

    beforeAll(async () => {
      token = await registerAndLogin()
      userId = userIdFromToken(token)
      categoryId = await createCategory(userId)
    })

    it('201: cria transação de receita sem cardId', async () => {
      const res = await api()
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Salário', amount: 5800, type: 'income', categoryId, cardId: null, date: '2026-06-14', notes: 'Mensal', isRecurring: false })
      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.title).toBe('Salário')
      expect(res.body.data.amount).toBe(5800)
      expect(res.body.data.type).toBe('income')
    })

    it('201: cria transação de despesa com cardId', async () => {
      const cardId = await createCard(token)
      const res = await api()
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Mercado', amount: 312.47, type: 'expense', categoryId, cardId, date: '2026-06-12', notes: '', isRecurring: false })
      expect(res.status).toBe(201)
      expect(res.body.data.cardId).toBe(cardId)
      expect(res.body.data.type).toBe('expense')
    })

    it('nunca expõe userId na resposta do POST', async () => {
      const res = await api()
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Salário', amount: 5800, type: 'income', categoryId, cardId: null, date: '2026-06-14', isRecurring: false })
      expect(res.body.data).not.toHaveProperty('userId')
      expect(res.body.data).not.toHaveProperty('user_id')
    })
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

  describe('usuário autenticado', () => {
    let token: string
    let userId: string
    let categoryId: string

    beforeAll(async () => {
      token = await registerAndLogin()
      userId = userIdFromToken(token)
      categoryId = await createCategory(userId)
    })

    it('404: transação não existe', async () => {
      const res = await api()
        .put('/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Novo' })
      expect(res.status).toBe(404)
    })

    it('200: atualiza title corretamente', async () => {
      const [tx] = await testDb
        .insert(schema.transactions)
        .values({ userId, categoryId, title: 'Título antigo', amount: '100.00', type: 'expense', date: '2026-06-10', isRecurring: false })
        .returning({ id: schema.transactions.id })
      const res = await api()
        .put(`/transactions/${tx.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Título novo' })
      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe('Título novo')
    })
  })

  describe('isolamento entre usuários', () => {
    let token1: string
    let txId: string

    beforeAll(async () => {
      token1 = await registerAndLogin()
      const token2 = await registerAndLogin({ name: 'Pedro Silva', email: 'pedro@teste.com' })
      const userId2 = userIdFromToken(token2)
      const categoryId = await createCategory(userId2)
      const [tx] = await testDb
        .insert(schema.transactions)
        .values({ userId: userId2, categoryId, title: 'Transação do Pedro', amount: '500.00', type: 'expense', date: '2026-06-10', isRecurring: false })
        .returning({ id: schema.transactions.id })
      txId = tx.id
    })

    it('404: não pode editar transação de outro usuário', async () => {
      const res = await api()
        .put(`/transactions/${txId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Tentativa de edição' })
      expect(res.status).toBe(404)
    })
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

  describe('usuário autenticado', () => {
    let token: string
    let userId: string
    let categoryId: string

    beforeAll(async () => {
      token = await registerAndLogin()
      userId = userIdFromToken(token)
      categoryId = await createCategory(userId)
    })

    it('404: transação não existe', async () => {
      const res = await api()
        .delete('/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(404)
    })

    it('204: deleta transação própria', async () => {
      const [tx] = await testDb
        .insert(schema.transactions)
        .values({ userId, categoryId, title: 'A deletar', amount: '50.00', type: 'expense', date: '2026-06-10', isRecurring: false })
        .returning({ id: schema.transactions.id })
      const res = await api().delete(`/transactions/${tx.id}`).set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(204)
    })

    it('transação deletada não aparece no GET do mês', async () => {
      const [tx] = await testDb
        .insert(schema.transactions)
        .values({ userId, categoryId, title: 'A deletar 2', amount: '50.00', type: 'expense', date: '2026-06-10', isRecurring: false })
        .returning({ id: schema.transactions.id })
      await api().delete(`/transactions/${tx.id}`).set('Authorization', `Bearer ${token}`)
      const res = await api()
        .get('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: '2026-06' })
      const titles = res.body.data.transactions.map((t: any) => t.title)
      expect(titles).not.toContain('A deletar 2')
    })
  })

  describe('isolamento entre usuários', () => {
    let token1: string
    let txId: string

    beforeAll(async () => {
      token1 = await registerAndLogin()
      const token2 = await registerAndLogin({ name: 'Pedro Silva', email: 'pedro@teste.com' })
      const userId2 = userIdFromToken(token2)
      const categoryId = await createCategory(userId2)
      const [tx] = await testDb
        .insert(schema.transactions)
        .values({ userId: userId2, categoryId, title: 'Transação do Pedro', amount: '500.00', type: 'expense', date: '2026-06-10', isRecurring: false })
        .returning({ id: schema.transactions.id })
      txId = tx.id
    })

    it('404: não pode deletar transação de outro usuário', async () => {
      const res = await api()
        .delete(`/transactions/${txId}`)
        .set('Authorization', `Bearer ${token1}`)
      expect(res.status).toBe(404)
    })
  })
})

// ─────────────────────────────────────────────────────
// DELETE /transactions?month= (exclusão em massa)
// ─────────────────────────────────────────────────────

describe('DELETE /transactions (bulk por mês)', () => {
  it('401: sem token', async () => {
    const res = await api().delete('/transactions').query({ month: '2026-07' })
    expect(res.status).toBe(401)
  })

  describe('usuário autenticado', () => {
    let token: string
    let userId: string
    let categoryId: string

    beforeAll(async () => {
      token = await registerAndLogin()
      userId = userIdFromToken(token)
      categoryId = await createCategory(userId)
    })

    it('400: month em formato inválido', async () => {
      const res = await api()
        .delete('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: '2026-7' })
      expect(res.status).toBe(400)
    })

    it('200: exclui apenas as transações do mês informado', async () => {
      await testDb.insert(schema.transactions).values([
        { userId, categoryId, title: 'Julho 1', amount: '10.00', type: 'expense', date: '2026-07-05', isRecurring: false },
        { userId, categoryId, title: 'Julho 2', amount: '20.00', type: 'expense', date: '2026-07-20', isRecurring: false },
        { userId, categoryId, title: 'Agosto', amount: '30.00', type: 'expense', date: '2026-08-01', isRecurring: false },
      ])

      const res = await api()
        .delete('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: '2026-07' })

      expect(res.status).toBe(200)
      expect(res.body.data.deletedCount).toBe(2)

      const remaining = await testDb
        .select({ title: schema.transactions.title })
        .from(schema.transactions)
        .where(eq(schema.transactions.userId, userId))
      expect(remaining.map(r => r.title)).toEqual(['Agosto'])

      // limpa para não afetar os próximos casos
      await testDb.delete(schema.transactions).where(eq(schema.transactions.userId, userId))
    })

    // Regressão: transações confirmadas via import ficam vinculadas em
    // import_extracted_transactions.transactionId. Sem onDelete: 'set null'
    // nessa FK, o bulk delete falhava com 500 (violação de constraint) ao
    // encontrar qualquer transação nesse estado.
    it('200: exclui transação vinculada a um import confirmado sem violar FK', async () => {
      const [image] = await testDb
        .insert(schema.importImages)
        .values({ userId, imageHash: `hash-bulk-${Date.now()}`, bank: 'mercadopago', format: 'screenshot', status: 'processed' })
        .returning()

      const [tx] = await testDb
        .insert(schema.transactions)
        .values({ userId, categoryId, title: 'Vinda de import', amount: '75.00', type: 'expense', date: '2026-07-10', isRecurring: false })
        .returning({ id: schema.transactions.id })

      await testDb.insert(schema.importExtractedTransactions).values({
        imageId: image.id,
        userId,
        title: 'Vinda de import',
        amount: '75.00',
        type: 'expense',
        date: '2026-07-10',
        status: 'confirmed',
        transactionId: tx.id,
      })

      const res = await api()
        .delete('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: '2026-07' })

      expect(res.status).toBe(200)
      expect(res.body.data.deletedCount).toBe(1)

      const [extracted] = await testDb
        .select({ transactionId: schema.importExtractedTransactions.transactionId })
        .from(schema.importExtractedTransactions)
        .where(eq(schema.importExtractedTransactions.imageId, image.id))
      expect(extracted.transactionId).toBeNull()
    })

    it('200: deletedCount 0 quando não há transações no mês', async () => {
      const res = await api()
        .delete('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .query({ month: '2020-01' })
      expect(res.status).toBe(200)
      expect(res.body.data.deletedCount).toBe(0)
    })
  })

  describe('isolamento entre usuários', () => {
    it('não exclui transações de outro usuário', async () => {
      const token1 = await registerAndLogin()
      const token2 = await registerAndLogin({ name: 'Pedro Silva', email: 'pedro-bulk@teste.com' })
      const userId2 = userIdFromToken(token2)
      const categoryId2 = await createCategory(userId2)

      await testDb.insert(schema.transactions).values({
        userId: userId2, categoryId: categoryId2, title: 'Do Pedro', amount: '99.00', type: 'expense', date: '2026-07-15', isRecurring: false,
      })

      const res = await api()
        .delete('/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .query({ month: '2026-07' })

      expect(res.status).toBe(200)
      expect(res.body.data.deletedCount).toBe(0)

      const stillThere = await testDb
        .select({ title: schema.transactions.title })
        .from(schema.transactions)
        .where(eq(schema.transactions.userId, userId2))
      expect(stillThere).toHaveLength(1)
    })
  })
})
