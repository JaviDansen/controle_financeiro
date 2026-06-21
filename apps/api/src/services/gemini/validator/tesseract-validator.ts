import { ValidationResult } from '../types'
import { analyzeDateHeaderImage } from './date-header-detector'

export async function validateWithTesseract(imagePath: string): Promise<ValidationResult> {
  try {
    const analysis = await analyzeDateHeaderImage(imagePath)

    return {
      valid: analysis.valid,
      reason: analysis.valid
        ? undefined
        : 'Nenhum cabeçalho de data encontrado na imagem pelo OCR Tesseract',
    }
  } catch {
    return {
      valid: false,
      reason: 'Tesseract não disponível ou falhou ao processar a imagem',
    }
  }
}
