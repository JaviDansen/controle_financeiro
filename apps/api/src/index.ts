import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { resolve } from 'path'
import { Pool } from 'pg'

config({ path: resolve(__dirname, '../../../.env') })

import { buildConnectionString, getConnectionLabel } from '@finapp/db'
import authRoutes from './routes/auth.routes'
import cardsRoutes from './routes/cards.routes'
import transactionsRoutes from './routes/transactions.routes'
import categoriesRoutes from './routes/categories.routes'
import { requestErrorHandler, requestLogger } from './middlewares/request-logger.middleware'

export const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(requestLogger)

app.use('/auth', authRoutes)
app.use('/cards', cardsRoutes)
app.use('/transactions', transactionsRoutes)
app.use('/categories', categoriesRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/hello', (_req, res) => {
  res.json({ message: 'Hello World', env: process.env.NODE_ENV ?? 'development' })
})

app.use(requestErrorHandler)

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
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`)
    checkDatabase()
  })
}
