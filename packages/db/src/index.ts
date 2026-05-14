import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { buildConnectionString } from './connection'

import * as schema from '../schema'

const pool = new Pool({ connectionString: buildConnectionString() })

export const db = drizzle(pool, { schema })

export async function closeDb(): Promise<void> {
  await pool.end()
}

export * from '../schema'
export { buildConnectionString, getConnectionLabel } from './connection'
