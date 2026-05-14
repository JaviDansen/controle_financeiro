import { getTableName } from 'drizzle-orm'
import { users, categories, cards, transactions, goals } from '@finapp/db'

describe('Schema — nomes das tabelas no banco', () => {
  it.each([
    [users, 'users'],
    [categories, 'categories'],
    [cards, 'cards'],
    [transactions, 'transactions'],
    [goals, 'goals'],
  ])('tabela %s mapeia para "%s"', (table, expected) => {
    expect(getTableName(table)).toBe(expected)
  })
})

describe('Schema users — colunas', () => {
  it('tem todas as colunas obrigatórias', () => {
    expect(users).toHaveProperty('id')
    expect(users).toHaveProperty('name')
    expect(users).toHaveProperty('email')
    expect(users).toHaveProperty('passwordHash')
    expect(users).toHaveProperty('createdAt')
    expect(users).toHaveProperty('updatedAt')
  })

  it('coluna passwordHash mapeia para "password_hash" no banco', () => {
    expect(users.passwordHash.name).toBe('password_hash')
  })
})

describe('Schema transactions — colunas', () => {
  it('tem todas as colunas obrigatórias', () => {
    expect(transactions).toHaveProperty('id')
    expect(transactions).toHaveProperty('userId')
    expect(transactions).toHaveProperty('categoryId')
    expect(transactions).toHaveProperty('title')
    expect(transactions).toHaveProperty('amount')
    expect(transactions).toHaveProperty('type')
    expect(transactions).toHaveProperty('date')
    expect(transactions).toHaveProperty('isRecurring')
    expect(transactions).toHaveProperty('createdAt')
  })

  it('cardId é opcional (nullable)', () => {
    expect(transactions.cardId.notNull).toBeFalsy()
  })
})

describe('Schema goals — colunas', () => {
  it('tem todas as colunas obrigatórias', () => {
    expect(goals).toHaveProperty('id')
    expect(goals).toHaveProperty('userId')
    expect(goals).toHaveProperty('title')
    expect(goals).toHaveProperty('targetAmount')
    expect(goals).toHaveProperty('currentAmount')
    expect(goals).toHaveProperty('isActive')
  })

  it('deadline é opcional (nullable)', () => {
    expect(goals.deadline.notNull).toBeFalsy()
  })
})
