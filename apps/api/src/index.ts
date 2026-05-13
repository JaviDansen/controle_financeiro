import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { resolve } from 'path'
import { Pool } from 'pg'

config({ path: resolve(__dirname, '../../../.env') })

import { buildConnectionString, getConnectionLabel } from '@finapp/db'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

async function checkDatabase(): Promise<void> {
  const pool = new Pool({ connectionString: buildConnectionString() })
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    console.log('✔ Banco de dados conectado:', getConnectionLabel())
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('✘ Falha ao conectar no banco de dados:', message)
    console.error('  Host:', getConnectionLabel())
    process.exit(1)
  } finally {
    await pool.end()
  }
}

app.listen(PORT, async () => {
  console.log(`API rodando na porta ${PORT}`)
  await checkDatabase()
})
