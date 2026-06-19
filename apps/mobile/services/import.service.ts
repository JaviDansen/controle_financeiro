const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export type ImportFormat = 'screenshot' | 'csv' | 'pdf' | 'xls' | 'xlsx'

export interface ExtractUploadPayload {
  fileBase64: string
  fileName: string
  format: ImportFormat
  mimeType?: string | null
}

export interface ImportResponse {
  imageId: string
  imageHash: string
  bank: string
  format: string
  fileName?: string
  mimeType?: string
  transactions: []
}

export async function sendExtractFile(
  file: ExtractUploadPayload,
  bank: string,
  token: string,
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
    }),
  })

  const json = await res.json()

  if (res.status === 409) throw new DuplicateImageError()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao enviar extrato')

  return json.data
}

export class DuplicateImageError extends Error {
  constructor() {
    super('Arquivo ja processado anteriormente')
    this.name = 'DuplicateImageError'
  }
}
