import { ValidationResult } from '../types'
import { analyzeDateHeaderImage } from './date-header-detector'

export async function validateWithTesseract(imagePath: string): Promise<ValidationResult> {
  try {
    const analysis = await analyzeDateHeaderImage(imagePath)

    return {
      valid: analysis.valid,
      detectedDate: analysis.matchedLine,
      reason: analysis.valid
        ? undefined
        : 'Nenhum cabeçalho de data encontrado na imagem pelo OCR Tesseract',
    }
  } catch {
    return {
      valid: false,
      reason: 'Tesseract n�o dispon�vel ou falhou ao processar a imagem',
    }
  }
}
