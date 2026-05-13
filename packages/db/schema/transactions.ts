import { pgTable, uuid, varchar, numeric, boolean, date, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { categories } from './categories'
import { cards } from './cards'

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  cardId: uuid('card_id').references(() => cards.id),
  title: varchar('title', { length: 200 }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // 'income' | 'expense'
  date: date('date').notNull(),
  notes: text('notes'),
  isRecurring: boolean('is_recurring').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
