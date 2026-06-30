import { ImportFormat, SupportedBank } from '../types'
import { buildMercadopagoPrompt } from './banks/mercadopago'

export function getPrompt(bank: SupportedBank, format: ImportFormat, referenceDate?: string): string {
  if (format === 'screenshot') {
    if (bank === 'mercadopago') return buildMercadopagoPrompt(referenceDate)
  }

  throw new Error(`Prompt nao disponivel para banco="${bank}" format="${format}"`)
}
