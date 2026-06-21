import { ImportFormat, SupportedBank } from '../types'
import { mercadopagoPrompt } from './banks/mercadopago'

export function getPrompt(bank: SupportedBank, format: ImportFormat): string {
  if (format === 'screenshot') {
    if (bank === 'mercadopago') return mercadopagoPrompt
  }

  // fallback genérico — a ser implementado quando necessário
  throw new Error(`Prompt não disponível para banco="${bank}" format="${format}"`)
}
