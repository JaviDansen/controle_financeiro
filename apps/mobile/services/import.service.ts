const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export interface ImportResponse {
  imageId: string
  imageHash: string
  bank: string
  format: string
  transactions: []
}

export async function sendExtractImage(
  imageBase64: string,
  bank: string,
  token: string,
): Promise<ImportResponse> {
  const res = await fetch(`${API_URL}/import/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ imageBase64, bank, format: 'screenshot' }),
  })

  const json = await res.json()

  if (res.status === 409) throw new DuplicateImageError()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao enviar extrato')

  return json.data
}

export class DuplicateImageError extends Error {
  constructor() {
    super('Imagem ja processada anteriormente')
    this.name = 'DuplicateImageError'
  }
}
