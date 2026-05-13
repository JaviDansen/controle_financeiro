import { resolve } from 'path'
import { readFileSync } from 'fs'
import { config } from 'dotenv'

config({ path: resolve(__dirname, '../../../../.env') })

import { findDocumentId, replaceDocumentContent } from '../services/docs.service'

const INPUT_FILE = resolve(__dirname, '../../../../base_knowledge/technical/OFFICIAL-FinApp_Documentacao_Tecnica.md')

async function main() {
  console.log('📖 Lendo arquivo local...')
  const content = readFileSync(INPUT_FILE, 'utf-8')
  console.log(`✅ Conteúdo lido (${content.length} caracteres)`)

  console.log('🔍 Localizando documento no Drive...')
  const docId = await findDocumentId()
  console.log('✅ Documento encontrado:', docId)

  console.log('📤 Enviando conteúdo atualizado para o Google Docs...')
  await replaceDocumentContent(docId, content)

  console.log('✅ Google Doc atualizado com sucesso!')
}

main().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
