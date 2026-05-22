const { Pool } = require('pg')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST })

async function run() {
  const client = await pool.connect()
  try {
    const drizzle = await client.query(`
      SELECT * FROM drizzle."__drizzle_migrations" ORDER BY created_at
    `)
    console.log('drizzle.__drizzle_migrations:', JSON.stringify(drizzle.rows, null, 2))
  } catch (err) {
    console.log('Erro:', err.message)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
