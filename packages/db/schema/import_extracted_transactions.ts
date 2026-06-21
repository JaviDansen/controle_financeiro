import { pgTable, uuid, varchar, numeric, boolean, date, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { categories } from './categories'
import { transactions } from './transactions'
import { importImages } from './import_images'

export const importExtractedTransactions = pgTable('import_extracted_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  imageId: uuid('image_id').notNull().references(() => importImages.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Dados extraídos pelo Gemini
  title: varchar('title', { length: 200 }).notNull(),
  description: varchar('description', { length: 300 }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(),        // 'income' | 'expense'
  date: date('date').notNull(),
  time: varchar('time', { length: 10 }),                  // "14h06" — só para exibição
  paymentMethod: varchar('payment_method', { length: 100 }),
  dateInferred: boolean('date_inferred').notNull().default(false),

  // Controle de itens ignorados
  skipped: boolean('skipped').notNull().default(false),
  skipReason: varchar('skip_reason', { length: 100 }),    // "Reserva automática" | "Cancelado"

  // Revisão pelo usuário
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'confirmed' | 'discarded'
  categoryId: uuid('category_id').references(() => categories.id),        // sugerido ou escolhido pelo usuário
  transactionId: uuid('transaction_id').references(() => transactions.id), // preenchido após confirmação

  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type ImportExtractedTransaction = typeof importExtractedTransactions.$inferSelect
export type NewImportExtractedTransaction = typeof importExtractedTransactions.$inferInsert
