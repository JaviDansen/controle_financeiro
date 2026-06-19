import * as dotenv from 'dotenv'
import * as path from 'path'

export default async function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

  if (!process.env.DATABASE_URL_TEST) {
    console.warn(
      '[test] DATABASE_URL_TEST não definida — testes que acessam o banco serão ignorados ou falharão.'
    )
    return
  }

  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
}
