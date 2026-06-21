const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export type ImportFormat = 'screenshot' | 'csv' | 'pdf' | 'xls' | 'xlsx'
export type ValidationStrategy = 'gemini' | 'tesseract'

export interface ExtractUploadPayload {
  fileBase64: string
  fileName: string
  format: ImportFormat
  mimeType?: string | null
}

export interface ExtractedTransaction {
  title: string
  description: string
  amount: number
  type: 'income' | 'expense'
  date: string
  time: string
  date_inferred: boolean
  payment_method: string | null
  skipped: boolean
  skip_reason: string | null
}

export interface ImportResponse {
  imageId: string
  imageHash: string
  bank: string
  format: string
  fileName?: string
  mimeType?: string
  transactions: ExtractedTransaction[]
}

export async function sendExtractFile(
  file: ExtractUploadPayload,
  bank: string,
  token: string,
  validationStrategy: ValidationStrategy = 'tesseract',
): Promise<ImportResponse> {
  const res = await fetch(`${API_URL}/import/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bank,
      format: file.format,
      fileBase64: file.fileBase64,
      fileName: file.fileName,
      mimeType: file.mimeType,
      validationStrategy,
    }),
  })

  const json = await res.json()

  if (res.status === 409) throw new DuplicateImageError()
  if (res.status === 400 && json.error === 'header_not_found') throw new HeaderNotFoundError()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao enviar extrato')

  return json.data
}

export class DuplicateImageError extends Error {
  constructor() {
    super('Arquivo ja processado anteriormente')
    this.name = 'DuplicateImageError'
  }
}

export class HeaderNotFoundError extends Error {
  constructor() {
    super('Nenhum cabecalho de data encontrado na imagem')
    this.name = 'HeaderNotFoundError'
  }
}
