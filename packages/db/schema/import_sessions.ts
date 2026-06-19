import { pgTable, uuid, integer, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { importImages } from './import_images'

export const importSessions = pgTable('import_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  imageId: uuid('image_id').notNull().references(() => importImages.id, { onDelete: 'cascade' }),
  extractedCount: integer('extracted_count').notNull().default(0),
  confirmedCount: integer('confirmed_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type ImportSession = typeof importSessions.$inferSelect
export type NewImportSession = typeof importSessions.$inferInsert
