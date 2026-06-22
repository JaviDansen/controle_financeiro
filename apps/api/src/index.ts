import { resolve } from 'path'
// dotenv deve ser carregado antes de qualquer import que leia process.env
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: resolve(__dirname, '../../../.env') })

import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'

import { buildConnectionString, getConnectionLabel } from '@finapp/db'
import authRoutes from './routes/auth.routes'
import cardsRoutes from './routes/cards.routes'
import transactionsRoutes from './routes/transactions.routes'
import categoriesRoutes from './routes/categories.routes'
import importRoutes from './routes/import.routes'
import { requestErrorHandler, requestLogger } from './middlewares/request-logger.middleware'

export const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use(requestLogger)

app.use('/auth', authRoutes)
app.use('/cards', cardsRoutes)
app.use('/transactions', transactionsRoutes)
app.use('/categories', categoriesRoutes)
app.use('/import', importRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/hello', (_req, res) => {
  res.json({ message: 'Hello World', env: process.env.NODE_ENV ?? 'development' })
})

app.use(requestErrorHandler)

function log(level: 'INF' | 'ERR', message: string, fields?: Record<string, unknown>): void {
  const time = new Date().toTimeString().slice(0, 8)
  const suffix = fields
    ? ' ' + Object.entries(fields).map(([k, v]) => `${k}=${v}`).join(' ')
    : ''
  const line = `${time} [${level}] ${message}${suffix}`
  level === 'ERR' ? console.error(line) : console.log(line)
}

async function checkDatabase(): Promise<void> {
  const pool = new Pool({ connectionString: buildConnectionString() })
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    log('INF', 'banco conectado', { host: getConnectionLabel() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log('ERR', 'banco falhou', { host: getConnectionLabel(), error: message })
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  app.listen(PORT, () => {
    log('INF', 'servidor iniciado', { port: PORT, gemini_model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash' })
    checkDatabase()
  })
}
