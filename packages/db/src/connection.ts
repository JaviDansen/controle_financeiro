import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../../.env') })

function buildConnectionStringFromParts(
  host: string,
  user: string,
  password: string,
  name: string,
  port?: string
): string {
  const safePort = port || '5432'
  const encodedPassword = encodeURIComponent(password)
  return `postgresql://${user}:${encodedPassword}@${host}:${safePort}/${name}`
}

export function buildConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const { DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME } = process.env

  if (DATABASE_HOST && DATABASE_USER && DATABASE_PASSWORD && DATABASE_NAME) {
    return buildConnectionStringFromParts(
      DATABASE_HOST,
      DATABASE_USER,
      DATABASE_PASSWORD,
      DATABASE_NAME,
      DATABASE_PORT
    )
  }

  if (process.env.DATABASE_URL_TEST) {
    return process.env.DATABASE_URL_TEST
  }

  const {
    DATABASE_TEST_HOST,
    DATABASE_TEST_PORT,
    DATABASE_TEST_USER,
    DATABASE_TEST_PASSWORD,
    DATABASE_TEST_NAME,
  } = process.env

  if (DATABASE_TEST_HOST && DATABASE_TEST_USER && DATABASE_TEST_PASSWORD && DATABASE_TEST_NAME) {
    return buildConnectionStringFromParts(
      DATABASE_TEST_HOST,
      DATABASE_TEST_USER,
      DATABASE_TEST_PASSWORD,
      DATABASE_TEST_NAME,
      DATABASE_TEST_PORT
    )
  }

  throw new Error(
    'Banco de dados não configurado. Defina DATABASE_URL, os parâmetros individuais de produção, DATABASE_URL_TEST ou os parâmetros individuais de teste no .env'
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

  if (
    process.env.DATABASE_TEST_HOST &&
    process.env.DATABASE_TEST_USER &&
    process.env.DATABASE_TEST_PASSWORD &&
    process.env.DATABASE_TEST_NAME
  ) {
    return `${process.env.DATABASE_TEST_HOST}:${process.env.DATABASE_TEST_PORT ?? 5432}/${process.env.DATABASE_TEST_NAME}`
  }

  return 'connection string inválida'
}
