import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const require = createRequire(import.meta.url)
const dotenv = require('dotenv')
const { Pool } = pg

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env') })

const url = process.env.DATABASE_URL_TEST
if (!url) {
  console.error('DATABASE_URL_TEST não definida')
  process.exit(1)
}

const pool = new Pool({ connectionString: url })
const db = drizzle(pool)

try {
  await migrate(db, { migrationsFolder: resolve(__dirname, './migrations') })
  console.log('✓ Migrations aplicadas no banco de testes')
} catch (err) {
  if (err.message?.includes('already exists')) {
    console.log('✓ Migrations já aplicadas (colunas existem)')
  } else {
    console.error('✗ Erro:', err.message)
    process.exit(1)
  }
} finally {
  await pool.end()
}
