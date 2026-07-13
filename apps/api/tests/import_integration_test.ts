import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
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

async function insertImage(userId: string, hashSuffix: string) {
  const [image] = await testDb
    .insert(schema.importImages)
    .values({ userId, imageHash: `hash-${hashSuffix}-${Date.now()}-${Math.random()}`, bank: 'mercadopago', format: 'screenshot', status: 'processed' })
    .returning()
  return image
}

async function insertExtracted(
  userId: string,
  imageId: string,
  overrides: Partial<typeof schema.importExtractedTransactions.$inferInsert> = {},
) {
  const [row] = await testDb
    .insert(schema.importExtractedTransactions)
    .values({
      imageId,
      userId,
      title: 'Compra teste',
      description: 'desc',
      amount: '50.00',
      type: 'expense',
      date: '2026-07-01',
      time: '10h00',
      status: 'pending',
      ...overrides,
    })
    .returning()
  return row
}

describe('POST /import/confirm', () => {
  it('401: sem token', async () => {
    const res = await api().post('/import/confirm').send({ transactions: [{ id: 'x', categoryId: 'y' }] })
    expect(res.status).toBe(401)
  })

  describe('com usuário autenticado', () => {
    let token: string
    let userId: string
    let categoryId: string

    beforeAll(async () => {
      token = await registerAndLogin()
      userId = userIdFromToken(token)
      const cat = await insertCategory(userId, 'Alimentação')
      categoryId = cat.id
    })

    it('400: payload vazio', async () => {
      const res = await api().post('/import/confirm').set('Authorization', `Bearer ${token}`).send({ transactions: [] })
      expect(res.status).toBe(400)
    })

    it('404: nenhuma transação pendente encontrada para IDs inexistentes', async () => {
      const res = await api()
        .post('/import/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ transactions: [{ id: '00000000-0000-0000-0000-000000000000', categoryId }] })
      expect(res.status).toBe(404)
    })

    it('confirma 1, 10 e 50 transações de uma vez, criando transactions reais e vinculando transactionId', async () => {
      for (const count of [1, 10, 50]) {
        const image = await insertImage(userId, `batch-${count}`)
        const rows = await Promise.all(
          Array.from({ length: count }, (_, i) => insertExtracted(userId, image.id, { title: `Item ${count}-${i}` }))
        )

        const res = await api()
          .post('/import/confirm')
          .set('Authorization', `Bearer ${token}`)
          .send({ transactions: rows.map(r => ({ id: r.id, categoryId })) })

        expect(res.status).toBe(200)
        expect(res.body.data.confirmed).toBe(count)
        expect(res.body.data.discarded).toBe(0)

        const updated = await testDb
          .select()
          .from(schema.importExtractedTransactions)
          .where(eq(schema.importExtractedTransactions.imageId, image.id))
        expect(updated).toHaveLength(count)
        updated.forEach(u => {
          expect(u.status).toBe('confirmed')
          expect(u.transactionId).not.toBeNull()
        })
      }
    })

    it('mistura confirmed e discarded corretamente no mesmo lote', async () => {
      const image = await insertImage(userId, 'mixed')
      const toConfirm = await insertExtracted(userId, image.id, { title: 'Confirmar' })
      const toDiscard = await insertExtracted(userId, image.id, { title: 'Descartar' })

      const res = await api()
        .post('/import/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({
          transactions: [
            { id: toConfirm.id, categoryId },
            { id: toDiscard.id, categoryId, discard: true },
          ],
        })

      expect(res.status).toBe(200)
      expect(res.body.data.confirmed).toBe(1)
      expect(res.body.data.discarded).toBe(1)

      const [confirmedRow] = await testDb
        .select()
        .from(schema.importExtractedTransactions)
        .where(eq(schema.importExtractedTransactions.id, toConfirm.id))
      const [discardedRow] = await testDb
        .select()
        .from(schema.importExtractedTransactions)
        .where(eq(schema.importExtractedTransactions.id, toDiscard.id))

      expect(confirmedRow.status).toBe('confirmed')
      expect(confirmedRow.transactionId).not.toBeNull()
      expect(discardedRow.status).toBe('discarded')
      expect(discardedRow.transactionId).toBeNull()
    })

    it('mantém o formato de resposta { data: { confirmed, discarded } }', async () => {
      const image = await insertImage(userId, 'shape')
      const row = await insertExtracted(userId, image.id)
      const res = await api()
        .post('/import/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ transactions: [{ id: row.id, categoryId }] })

      expect(res.body).toEqual({ data: { confirmed: expect.any(Number), discarded: expect.any(Number) } })
    })

    it('não confirma transações já confirmadas (status não é mais pending)', async () => {
      const image = await insertImage(userId, 'already-confirmed')
      const row = await insertExtracted(userId, image.id, { status: 'confirmed' })

      const res = await api()
        .post('/import/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({ transactions: [{ id: row.id, categoryId }] })

      expect(res.status).toBe(404)
    })
  })

  describe('isolamento entre usuários', () => {
    it('não permite confirmar transações extraídas de outro usuário', async () => {
      const token1 = await registerAndLogin()
      const userId1 = userIdFromToken(token1)
      const cat1 = await insertCategory(userId1, 'Cat1')

      const token2 = await registerAndLogin({ email: 'outro-import@teste.com' })
      const userId2 = userIdFromToken(token2)

      const image2 = await insertImage(userId2, 'other-user')
      const row2 = await insertExtracted(userId2, image2.id)

      const res = await api()
        .post('/import/confirm')
        .set('Authorization', `Bearer ${token1}`)
        .send({ transactions: [{ id: row2.id, categoryId: cat1.id }] })

      expect(res.status).toBe(404)

      const [stillPending] = await testDb
        .select()
        .from(schema.importExtractedTransactions)
        .where(eq(schema.importExtractedTransactions.id, row2.id))
      expect(stillPending.status).toBe('pending')
    })
  })
})
