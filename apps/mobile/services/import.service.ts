const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export class DuplicateImageError extends Error {
  imageId?: string
  constructor(imageId?: string) {
    super('Arquivo ja processado anteriormente')
    this.name = 'DuplicateImageError'
    this.imageId = imageId
  }
}

export type ImportFormat = 'screenshot' | 'csv' | 'pdf' | 'xls' | 'xlsx'

export interface ExtractUploadPayload {
  fileBase64: string
  fileName: string
  format: ImportFormat
  mimeType?: string | null
}

export interface ExtractedTransaction {
  extractedId: string | null
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
  bank: string
  format: string
  transactions: ExtractedTransaction[]
}

export interface GalleryItem {
  imageId: string
  fileName: string
  filePath: string
  createdAt: string
  sizeBytes: number
}

export interface ConfirmItem {
  id: string
  categoryId: string
  discard?: boolean
}

export interface ConfirmResponse {
  confirmed: number
  discarded: number
}

export async function extractFile(
  file: ExtractUploadPayload,
  bank: string,
  token: string,
  referenceDate: string,
  sessionToken?: string,
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
      referenceDate,
      sessionToken,
    }),
  })

  const json = await res.json()

  if (res.status === 409) throw new DuplicateImageError(json.imageId)
  if (!res.ok) throw new Error(json.error ?? 'Erro ao enviar extrato')

  return json.data
}

export async function extractByImageId(
  imageId: string,
  bank: string,
  token: string,
  referenceDate?: string,
): Promise<ImportResponse> {
  const res = await fetch(`${API_URL}/import/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ imageId, bank, format: 'screenshot', referenceDate }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao extrair transacoes')
  return json.data
}

export async function getImportGallery(token: string): Promise<GalleryItem[]> {
  const res = await fetch(`${API_URL}/import/gallery`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar galeria')
  return json.data
}

export async function confirmImport(
  items: ConfirmItem[],
  token: string,
): Promise<ConfirmResponse> {
  const res = await fetch(`${API_URL}/import/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ transactions: items }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao confirmar transações')
  return json.data
}

export async function deleteImage(imageId: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/import/image/${imageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao excluir imagem')
}
