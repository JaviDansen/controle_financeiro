import * as dotenv from 'dotenv'
import * as path from 'path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '@finapp/db'

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST })
export const testDb = drizzle(pool, { schema })

export async function closeDb() {
  await pool.end()
}
