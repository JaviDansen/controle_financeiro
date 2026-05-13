import { google } from 'googleapis'
import { googleAuth } from './google-auth.service'

const DOC_NAME = 'OFFICIAL-FinApp_Documentacao_Tecnica'

async function getDriveClient() {
  const auth = await googleAuth.getClient()
  return google.drive({ version: 'v3', auth: auth as never })
}

async function getDocsClient() {
  const auth = await googleAuth.getClient()
  return google.docs({ version: 'v1', auth: auth as never })
}

export async function findDocumentId(): Promise<string> {
  const drive = await getDriveClient()

  const res = await drive.files.list({
    q: `name='${DOC_NAME}' and mimeType='application/vnd.google-apps.document' and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 1,
  })

  const files = res.data.files ?? []
  if (files.length === 0) {
    throw new Error(`Documento "${DOC_NAME}" não encontrado no Drive. Verifique se foi compartilhado com a service account.`)
  }

  return files[0].id!
}

export async function readDocument(documentId: string) {
  const docs = await getDocsClient()
  const res = await docs.documents.get({ documentId })
  return res.data
}

export async function appendToDocument(documentId: string, text: string) {
  const docs = await getDocsClient()

  const doc = await docs.documents.get({ documentId, fields: 'body' })
  const endIndex = doc.data.body?.content?.at(-1)?.endIndex ?? 1

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: endIndex - 1 },
            text,
          },
        },
      ],
    },
  })
}

export async function exportDocument(documentId: string): Promise<string> {
  const drive = await getDriveClient()
  const res = await drive.files.export(
    { fileId: documentId, mimeType: 'text/plain' },
    { responseType: 'text' }
  )
  return res.data as string
}

export async function replaceDocumentContent(documentId: string, newContent: string) {
  const docs = await getDocsClient()
  const doc = await docs.documents.get({ documentId, fields: 'body' })
  const endIndex = doc.data.body?.content?.at(-1)?.endIndex ?? 2

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        { deleteContentRange: { range: { startIndex: 1, endIndex: endIndex - 1 } } },
        { insertText: { location: { index: 1 }, text: newContent } },
      ],
    },
  })
}

export async function replaceSection(documentId: string, marker: string, newContent: string) {
  const docs = await getDocsClient()

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          replaceAllText: {
            containsText: { text: marker, matchCase: true },
            replaceText: newContent,
          },
        },
      ],
    },
  })
}
