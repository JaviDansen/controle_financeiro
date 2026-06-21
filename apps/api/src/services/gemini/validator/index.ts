import { ValidationResult } from '../types'
import { validateWithGemini } from './gemini-validator'
import { validateWithTesseract } from './tesseract-validator'

export type ValidationStrategy = 'gemini' | 'tesseract'

function getDefaultStrategy(): ValidationStrategy {
  const strategy = process.env.GEMINI_VALIDATION_STRATEGY
  if (strategy === 'tesseract') return 'tesseract'
  return 'gemini'
}

export async function validateImageHasDateHeader(
  imagePath: string,
  strategy?: ValidationStrategy,
): Promise<ValidationResult> {
  const resolved = strategy ?? getDefaultStrategy()

  if (resolved === 'tesseract') {
    return validateWithTesseract(imagePath)
  }

  return validateWithGemini(imagePath)
}
