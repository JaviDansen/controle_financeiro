export type TransacaoExtraida = {
  // Identificação
  title: string
  description: string

  // Valor
  amount: number
  type: 'income' | 'expense'

  // Data e hora
  date: string           // ISO: "2026-06-19"
  time: string           // "14h06" — não persiste no banco
  date_inferred: boolean // true quando inferida do cabeçalho anterior

  // Meio de pagamento
  payment_method: string | null

  // Controle
  skipped: boolean
  skip_reason: string | null
}

export type GeminiUsage = {
  tokensPrompt: number
  tokensOutput: number
  tokensTotal: number
  costBrl: string  // numeric string para Drizzle: "0.002134"
}

export type ExtractionResult = {
  transactions: TransacaoExtraida[]
  usage: GeminiUsage
  raw?: string // resposta bruta da LLM — só em desenvolvimento
}

export type ValidationResult = {
  valid: boolean
  reason?: string // motivo da rejeição quando valid = false
}

export type ImportFormat = 'screenshot' | 'csv' | 'pdf' | 'xls' | 'xlsx'
export type SupportedBank = 'mercadopago'
