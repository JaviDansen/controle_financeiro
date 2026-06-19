import * as path from 'path'
import * as dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const MIGRATIONS_PATH = path.resolve(__dirname, '../../../packages/db/migrations')

const EXPECTED_TABLES = ['users', 'categories', 'cards', 'transactions', 'goals']

describe('Banco de dados de teste — setup via migrations', () => {
  let pool: Pool

  beforeAll(async () => {
    const connectionString = process.env.DATABASE_URL_TEST
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL_TEST não definida no .env — configure um banco separado para testes.'
      )
    }
    pool = new Pool({ connectionString })
  })

  afterAll(async () => {
    await pool.end()
  })

  it('executa as migrations sem erro', async () => {
    const db = drizzle(pool)
    await expect(
      migrate(db, { migrationsFolder: MIGRATIONS_PATH })
    ).resolves.not.toThrow()
  }, 30_000)

  it.each(EXPECTED_TABLES)(
    'tabela "%s" existe no banco de teste após migrations',
    async (tableName) => {
      const result = await pool.query<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        ) AS exists`,
        [tableName]
      )
      expect(result.rows[0].exists).toBe(true)
    }
  )
})
