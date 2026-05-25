import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../../.env') })

export function buildConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const { DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME } = process.env

  if (DATABASE_HOST && DATABASE_USER && DATABASE_PASSWORD && DATABASE_NAME) {
    const port = DATABASE_PORT || '5432'
    const encodedPassword = encodeURIComponent(DATABASE_PASSWORD)
    return `postgresql://${DATABASE_USER}:${encodedPassword}@${DATABASE_HOST}:${port}/${DATABASE_NAME}`
  }

  if (process.env.DATABASE_URL_TEST) {
    return process.env.DATABASE_URL_TEST
  }

  throw new Error(
    'Banco de dados não configurado. Defina DATABASE_URL, os parâmetros individuais DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD e DATABASE_NAME, ou DATABASE_URL_TEST no .env'
  )
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

  if (process.env.DATABASE_HOST && process.env.DATABASE_USER && process.env.DATABASE_PASSWORD && process.env.DATABASE_NAME) {
    return `${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT ?? 5432}/${process.env.DATABASE_NAME}`
  }

  if (process.env.DATABASE_URL_TEST) {
    try {
      const url = new URL(process.env.DATABASE_URL_TEST)
      return `${url.hostname}:${url.port}${url.pathname}`
    } catch {
      return 'connection string inválida'
    }
  }

  return 'connection string inválida'
}
