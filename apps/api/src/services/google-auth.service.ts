import { google } from 'googleapis'

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
]

function createAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não definida no .env')

  let credentials: object
  try {
    credentials = JSON.parse(raw)
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY contém JSON inválido')
  }

  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES })
}

export const googleAuth = createAuth()
