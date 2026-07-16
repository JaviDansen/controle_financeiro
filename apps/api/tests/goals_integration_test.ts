import jwt from 'jsonwebtoken'
import { api } from './helpers/app'
import { testDb } from './helpers/db'
import * as schema from '@finapp/db'

const VALID_USER = {
  name: 'Bruno Teste',
  email: 'bruno@teste.com',
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

async function insertGoal(userId: string, data: Partial<typeof schema.goals.$inferInsert>) {
  const [goal] = await testDb
    .insert(schema.goals)
    .values({
      userId,
      title: data.title ?? 'Meta Teste',
      targetAmount: data.targetAmount ?? '1000.00',
      currentAmount: data.currentAmount ?? '0.00',
      deadline: data.deadline ?? null,
      category: data.category ?? 'lazer',
      isActive: data.isActive ?? true,
      color: data.color ?? '#FF0000',
      emoji: data.emoji ?? '🎯',
    })
    .returning()
  return goal
}

describe('Módulo de Metas (Goals) — API Integration Tests', () => {

  // ─────────────────────────────────────────────────────
  // GET /goals
  // ─────────────────────────────────────────────────────
  describe('GET /goals', () => {
    it('401: sem token', async () => {
      const res = await api().get('/goals')
      expect(res.status).toBe(401)
    })

    describe('com usuário autenticado', () => {
      let token: string
      let userId: string

      beforeAll(async () => {
        token = await registerAndLogin()
        userId = userIdFromToken(token)
      })

      it('200: retorna lista vazia quando usuário não tem metas', async () => {
        const res = await api().get('/goals').set('Authorization', `Bearer ${token}`)
        expect(res.status).toBe(200)
        expect(res.body.data).toEqual([])
      })

      it('200: retorna campos mapeados corretamente', async () => {
        await insertGoal(userId, { title: 'Viagem', targetAmount: '5000.00', currentAmount: '1200.00' })
        const res = await api().get('/goals').set('Authorization', `Bearer ${token}`)
        expect(res.status).toBe(200)
        expect(res.body.data).toHaveLength(1)
        const g = res.body.data[0]
        expect(g).toHaveProperty('id')
        expect(g.title).toBe('Viagem')
        expect(g.targetAmount).toBe(5000)
        expect(g.currentAmount).toBe(1200)
        expect(g.isActive).toBe(true)
        expect(g.color).toBe('#FF0000')
        expect(g.emoji).toBe('🎯')
        expect(g).not.toHaveProperty('userId')
      })

      it('200: permite filtrar por isActive', async () => {
        await insertGoal(userId, { title: 'Ativa', isActive: true })
        await insertGoal(userId, { title: 'Inativa', isActive: false })

        const resAll = await api().get('/goals').set('Authorization', `Bearer ${token}`)
        // Pelo menos 3 (1 do teste anterior + 2 deste)
        expect(resAll.body.data.length).toBeGreaterThanOrEqual(3)

        const resActive = await api().get('/goals').set('Authorization', `Bearer ${token}`).query({ isActive: 'true' })
        expect(resActive.body.data.every((g: any) => g.isActive === true)).toBe(true)

        const resInactive = await api().get('/goals').set('Authorization', `Bearer ${token}`).query({ isActive: 'false' })
        expect(resInactive.body.data.every((g: any) => g.isActive === false)).toBe(true)
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

      it('200: retorna apenas metas do usuário autenticado', async () => {
        await insertGoal(userId1, { title: 'Meta do User 1' })
        await insertGoal(userId2, { title: 'Meta do User 2' })

        const res = await api().get('/goals').set('Authorization', `Bearer ${token1}`)
        expect(res.status).toBe(200)
        const myGoals = res.body.data.filter((g: any) => g.title.includes('Meta do User'))
        expect(myGoals).toHaveLength(1)
        expect(myGoals[0].title).toBe('Meta do User 1')
      })
    })
  })

  // ─────────────────────────────────────────────────────
  // POST /goals
  // ─────────────────────────────────────────────────────
  describe('POST /goals', () => {
    let token: string

    beforeAll(async () => {
      token = await registerAndLogin()
    })

    it('401: sem token', async () => {
      const res = await api().post('/goals').send({ title: 'Meta' })
      expect(res.status).toBe(401)
    })

    it('400: erros de validação Zod (sem campos obrigatórios)', async () => {
      const res = await api().post('/goals').set('Authorization', `Bearer ${token}`).send({})
      expect(res.status).toBe(400)
    })

    it('400: erro se currentAmount for maior que targetAmount', async () => {
      const res = await api()
        .post('/goals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Impossível',
          targetAmount: 1000,
          currentAmount: 1200,
          category: 'lazer',
        })
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('currentAmount nao pode exceder targetAmount')
    })

    it('201: cria meta com sucesso', async () => {
      const res = await api()
        .post('/goals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Comprar Notebook',
          targetAmount: 5000,
          currentAmount: 1000,
          deadline: '2026-12-31',
          category: 'tecnologia',
          color: '#00FF00',
          emoji: '💻',
        })
      expect(res.status).toBe(201)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.title).toBe('Comprar Notebook')
      expect(res.body.data.targetAmount).toBe(5000)
      expect(res.body.data.currentAmount).toBe(1000)
      expect(res.body.data.deadline).toBe('2026-12-31')
      expect(res.body.data.color).toBe('#00FF00')
      expect(res.body.data.emoji).toBe('💻')
    })
  })

  // ─────────────────────────────────────────────────────
  // GET /goals/:id
  // ─────────────────────────────────────────────────────
  describe('GET /goals/:id', () => {
    let token1: string
    let userId1: string
    let token2: string
    let goalId: string

    beforeAll(async () => {
      token1 = await registerAndLogin()
      userId1 = userIdFromToken(token1)
      token2 = await registerAndLogin({ email: 'outro@teste.com' })

      const goal = await insertGoal(userId1, { title: 'Meta Secreta' })
      goalId = goal.id
    })

    it('404: meta não encontrada para outro usuário', async () => {
      const res = await api().get(`/goals/${goalId}`).set('Authorization', `Bearer ${token2}`)
      expect(res.status).toBe(404)
    })

    it('200: retorna meta do próprio usuário', async () => {
      const res = await api().get(`/goals/${goalId}`).set('Authorization', `Bearer ${token1}`)
      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe('Meta Secreta')
    })
  })

  // ─────────────────────────────────────────────────────
  // PATCH /goals/:id
  // ─────────────────────────────────────────────────────
  describe('PATCH /goals/:id', () => {
    let token1: string
    let userId1: string
    let token2: string
    let goalId: string

    beforeAll(async () => {
      token1 = await registerAndLogin()
      userId1 = userIdFromToken(token1)
      token2 = await registerAndLogin({ email: 'outro@teste.com' })
    })

    beforeEach(async () => {
      const goal = await insertGoal(userId1, { title: 'Meta Editável', targetAmount: '1000.00', currentAmount: '100.00' })
      goalId = goal.id
    })

    it('404: tenta editar meta de outro usuário', async () => {
      const res = await api().patch(`/goals/${goalId}`).set('Authorization', `Bearer ${token2}`).send({ title: 'Hackeado' })
      expect(res.status).toBe(404)
    })

    it('200: atualiza dados com sucesso', async () => {
      const res = await api()
        .patch(`/goals/${goalId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Meta Atualizada', currentAmount: 500 })
      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe('Meta Atualizada')
      expect(res.body.data.currentAmount).toBe(500)
    })

    it('400: erro se novo currentAmount exceder targetAmount existente', async () => {
      const res = await api()
        .patch(`/goals/${goalId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ currentAmount: 1500 })
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('currentAmount nao pode exceder targetAmount')
    })

    it('400: erro se novo currentAmount exceder novo targetAmount', async () => {
      const res = await api()
        .patch(`/goals/${goalId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ targetAmount: 200, currentAmount: 300 })
      expect(res.status).toBe(400)
      expect(res.body.error).toContain('currentAmount nao pode exceder targetAmount')
    })
  })

  // ─────────────────────────────────────────────────────
  // DELETE /goals/:id
  // ─────────────────────────────────────────────────────
  describe('DELETE /goals/:id', () => {
    let token1: string
    let userId1: string
    let token2: string
    let goalId: string

    beforeAll(async () => {
      token1 = await registerAndLogin()
      userId1 = userIdFromToken(token1)
      token2 = await registerAndLogin({ email: 'outro@teste.com' })
    })

    beforeEach(async () => {
      const goal = await insertGoal(userId1, { title: 'Meta a ser excluída' })
      goalId = goal.id
    })

    it('404: tenta excluir meta de outro usuário', async () => {
      const res = await api().delete(`/goals/${goalId}`).set('Authorization', `Bearer ${token2}`)
      expect(res.status).toBe(404)
    })

    it('200: exclui com sucesso', async () => {
      const res = await api().delete(`/goals/${goalId}`).set('Authorization', `Bearer ${token1}`)
      expect(res.status).toBe(200)

      // Garante que não é possível buscar após deletar
      const check = await api().get(`/goals/${goalId}`).set('Authorization', `Bearer ${token1}`)
      expect(check.status).toBe(404)
    })
  })
})
