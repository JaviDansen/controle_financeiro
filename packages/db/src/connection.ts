import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../../.env') })

export function buildConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const { DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME } = process.env

  if (!DATABASE_HOST || !DATABASE_USER || !DATABASE_PASSWORD || !DATABASE_NAME) {
    throw new Error(
      'Banco de dados não configurado. Defina DATABASE_URL ou DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD e DATABASE_NAME no .env'
    )
  }

  const port = DATABASE_PORT || '5432'
  const encodedPassword = encodeURIComponent(DATABASE_PASSWORD)
  return `postgresql://${DATABASE_USER}:${encodedPassword}@${DATABASE_HOST}:${port}/${DATABASE_NAME}`
}

export function getConnectionLabel(): string {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL)
      return `${url.hostname}:${url.port}${url.pathname}`
    } catch {
      return 'connection string inválida'
    }
  }
  return `${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT ?? 5432}/${process.env.DATABASE_NAME}`
}
