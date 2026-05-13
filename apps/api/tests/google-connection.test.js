const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') })
const { google } = require('googleapis')

const DOC_NAME = 'OFFICIAL-FinApp_Documentacao_Tecnica'

async function testGoogleConnection() {
  console.log('🔍 Verificando variável de ambiente...')

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não encontrada no .env')
  }

  let credentials
  try {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    console.log('✅ JSON da service account parseado com sucesso')
    console.log('   project_id:', credentials.project_id)
    console.log('   client_email:', credentials.client_email)
  } catch (err) {
    throw new Error('Falha ao fazer parse do JSON: ' + err.message)
  }

  console.log('\n🔐 Autenticando com Google...')
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents',
    ],
  })
  await auth.getClient()
  console.log('✅ Autenticação bem-sucedida')

  console.log('\n📂 Buscando documento no Drive...')
  const drive = google.drive({ version: 'v3', auth })
  const res = await drive.files.list({
    q: `name='${DOC_NAME}' and mimeType='application/vnd.google-apps.document' and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 1,
  })

  const files = res.data.files ?? []
  if (files.length === 0) {
    throw new Error(`Documento "${DOC_NAME}" não encontrado. Compartilhe-o com: ${credentials.client_email}`)
  }

  const docId = files[0].id
  console.log('✅ Documento encontrado!')
  console.log('   Nome:', files[0].name)
  console.log('   ID:', docId)

  console.log('\n📄 Lendo conteúdo do documento...')
  const docs = google.docs({ version: 'v1', auth })
  const doc = await docs.documents.get({ documentId: docId })
  console.log('✅ Documento lido com sucesso')
  console.log('   Título:', doc.data.title)

  console.log('\n✅ Sistema de documentação pronto para uso!')
}

testGoogleConnection().catch(err => {
  console.error('\n❌ Erro:', err.message)
  process.exit(1)
})
