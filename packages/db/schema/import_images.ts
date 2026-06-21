import { pgTable, uuid, varchar, integer, numeric, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const importImages = pgTable('import_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  imageHash: varchar('image_hash', { length: 64 }).notNull(),
  bank: varchar('bank', { length: 50 }).notNull(),
  format: varchar('format', { length: 20 }).notNull().default('screenshot'), // 'screenshot' | 'csv' | 'pdf'
  status: varchar('status', { length: 20 }).notNull().default('pending'),   // 'pending' | 'processed' | 'failed'
  filePath: varchar('file_path', { length: 500 }),                          // caminho local (simulado) → URL bucket (produção)
  // Custo da chamada Gemini
  tokensPrompt: integer('tokens_prompt'),
  tokensOutput: integer('tokens_output'),
  tokensTotal: integer('tokens_total'),
  costBrl: numeric('cost_brl', { precision: 10, scale: 6 }),                // estimativa em reais
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userHashUnique: uniqueIndex('import_images_user_hash_unique').on(table.userId, table.imageHash),
}))

export type ImportImage = typeof importImages.$inferSelect
export type NewImportImage = typeof importImages.$inferInsert
