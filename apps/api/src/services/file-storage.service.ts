/**
 * ARMAZENAMENTO SIMULADO — NÃO USAR EM PRODUÇÃO
 *
 * Salva arquivos em disco local (apps/api/data_import/ em dev, /app/apps/api/data_import/ no container) para viabilizar o
 * desenvolvimento da lógica de extração sem depender de object storage.
 *
 * OBRIGAÇÃO FUTURA: substituir este módulo por upload para S3/R2/GCS.
 * Ver base_knowledge/feature/auto-import/auto-import.md — seção "Obrigações antes de ir para produção".
 */

import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'

const DATA_IMPORT_ROOT = join(__dirname, '../../data_import')

function folderForFormat(format: string): 'images' | 'documents' {
  return format === 'screenshot' ? 'images' : 'documents'
}

function extForFormat(format: string, mimeType?: string | null): string {
  if (format === 'screenshot') {
    if (mimeType === 'image/png') return '.png'
    if (mimeType === 'image/webp') return '.webp'
    return '.jpg'
  }
  if (format === 'pdf') return '.pdf'
  if (format === 'csv') return '.csv'
  if (format === 'xls') return '.xls'
  if (format === 'xlsx') return '.xlsx'
  return extname(mimeType ?? '') || '.bin'
}

export async function saveUploadedFile(params: {
  userId: string
  imageId: string
  format: string
  mimeType?: string | null
  base64: string
}): Promise<string> {
  const { userId, imageId, format, mimeType, base64 } = params

  const folder = folderForFormat(format)
  const ext = extForFormat(format, mimeType)
  const dir = join(DATA_IMPORT_ROOT, folder, userId)

  await mkdir(dir, { recursive: true })

  const fileName = `${imageId}${ext}`
  const filePath = join(dir, fileName)
  const buffer = Buffer.from(base64, 'base64')

  await writeFile(filePath, buffer)

  // caminho relativo — suficiente para o filesystem local
  return `data_import/${folder}/${userId}/${fileName}`
}
