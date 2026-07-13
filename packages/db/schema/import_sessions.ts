import { pgTable, uuid, integer, varchar, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { importImages } from './import_images'

export const importSessions = pgTable('import_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 64 }).notNull(), // UUID gerado no mobile — agrupa N imagens
  imageId: uuid('image_id').references(() => importImages.id, { onDelete: 'cascade' }), // nullable
  extractedCount: integer('extracted_count').notNull().default(0),
  confirmedCount: integer('confirmed_count').notNull().default(0),
  ignoreKeywords: varchar('ignore_keywords', { length: 500 }).default('reserva, guardar ao gastar'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type ImportSession = typeof importSessions.$inferSelect
export type NewImportSession = typeof importSessions.$inferInsert
