import { pgTable, uuid, varchar, numeric, integer, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  bank: varchar('bank', { length: 100 }),
  type: varchar('type', { length: 10 }).notNull(), // 'credit' | 'debit'
  lastFour: varchar('last_four', { length: 4 }),
  holder: varchar('holder', { length: 100 }),
  expiry: varchar('expiry', { length: 10 }),
  creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }),
  closingDay: integer('closing_day'),
  dueDay: integer('due_day'),
  color: varchar('color', { length: 7 }),
  gradientTo: varchar('gradient_to', { length: 7 }),
  accent: varchar('accent', { length: 7 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
