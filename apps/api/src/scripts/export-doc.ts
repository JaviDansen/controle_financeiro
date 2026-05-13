import { resolve } from 'path'
import { writeFileSync, mkdirSync } from 'fs'
import { config } from 'dotenv'

config({ path: resolve(__dirname, '../../../../.env') })

import { findDocumentId, exportDocument } from '../services/docs.service'

const OUTPUT_DIR = resolve(__dirname, '../../../../base_knowledge/technical')
const OUTPUT_FILE = resolve(OUTPUT_DIR, 'OFFICIAL-FinApp_Documentacao_Tecnica.md')

async function main() {
  console.log('🔍 Localizando documento no Drive...')
  const docId = await findDocumentId()
  console.log('✅ Documento encontrado:', docId)

  console.log('📥 Exportando conteúdo...')
  const content = await exportDocument(docId)

  mkdirSync(OUTPUT_DIR, { recursive: true })
  writeFileSync(OUTPUT_FILE, content, 'utf-8')

  console.log('✅ Salvo em:', OUTPUT_FILE)
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
