import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../.env') })

import { buildConnectionString } from './src/connection'

export default defineConfig({
  schema: './schema',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: buildConnectionString(),
  },
})
