const { Pool } = require('pg')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const url = process.env.DATABASE_URL_TEST
if (!url) {
  console.error('DATABASE_URL_TEST não definida')
  process.exit(1)
}

const pool = new Pool({ connectionString: url })

async function run() {
  const client = await pool.connect()
  try {
    // Aplica colunas com IF NOT EXISTS (idempotente)
    await client.query(`
      ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "bank" varchar(100);
      ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "holder" varchar(100);
      ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "expiry" varchar(7);
      ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "gradient_to" varchar(7);
      ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "accent" varchar(7);
    `)
    console.log('✓ Colunas aplicadas (IF NOT EXISTS)')

    // Computa o hash exato que Drizzle usa (SHA256 do conteúdo do arquivo)
    const migrationContent = fs.readFileSync(
      path.resolve(__dirname, './migrations/0003_mixed_nighthawk.sql'),
      'utf8'
    )
    const hash = crypto.createHash('sha256').update(migrationContent).digest('hex')
    const createdAt = 1779144656164 // timestamp da migration 0003 (do _journal.json)

    // Verifica se já está registrada no tracking correto do Drizzle
    const existing = await client.query(
      `SELECT id FROM drizzle."__drizzle_migrations" WHERE hash = $1`,
      [hash]
    )
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO drizzle."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`,
        [hash, createdAt]
      )
      console.log(`✓ Migration 0003 registrada no tracking Drizzle (hash: ${hash.slice(0, 12)}...)`)
    } else {
      console.log('✓ Migration 0003 já registrada no tracking Drizzle')
    }
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(err => {
  console.error('✗ Erro:', err.message)
  process.exit(1)
})
