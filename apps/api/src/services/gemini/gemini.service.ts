import { readFile } from 'fs/promises'
import { join } from 'path'
import { geminiClient, GEMINI_MODEL } from './gemini.client'
import { getPrompt } from './prompts'
import { ExtractionResult, GeminiUsage, ImportFormat, SupportedBank } from './types'
import { getUsdToBrl } from '../exchange-rate.service'

// Raiz da app (apps/api/) - funciona tanto em ts-node (src/) quanto em build (dist/)
const API_ROOT = join(__dirname, '../../..')

// Gemini 2.5 Flash pricing (USD por 1M tokens)
const PRICE_INPUT_USD_PER_M = 0.30
const PRICE_OUTPUT_USD_PER_M = 1.00

async function calculateCostBrl(promptTokens: number, outputTokens: number): Promise<string> {
  const usdToBrl = await getUsdToBrl()
  const usd = (promptTokens / 1_000_000) * PRICE_INPUT_USD_PER_M
           + (outputTokens / 1_000_000) * PRICE_OUTPUT_USD_PER_M
  return (usd * usdToBrl).toFixed(6)
}

export async function extractFromImage(params: {
  filePath: string
  bank: SupportedBank
  format: ImportFormat
  referenceDate?: string
}): Promise<ExtractionResult> {
  const { filePath, bank, format, referenceDate } = params

  const absolutePath = join(API_ROOT, filePath)
  const imageBuffer = await readFile(absolutePath)
  const imageBase64 = imageBuffer.toString('base64')

  const prompt = getPrompt(bank, format, referenceDate)
  const model = geminiClient.getGenerativeModel({ model: GEMINI_MODEL })

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    },
    { text: prompt },
  ])

  const meta = result.response.usageMetadata
  const tokensPrompt = meta?.promptTokenCount ?? 0
  const tokensOutput = meta?.candidatesTokenCount ?? 0
  const tokensTotal = meta?.totalTokenCount ?? 0
  const costBrl = await calculateCostBrl(tokensPrompt, tokensOutput)

  const usage: GeminiUsage = { tokensPrompt, tokensOutput, tokensTotal, costBrl }
  console.log(`[gemini] tokens - prompt: ${tokensPrompt}, output: ${tokensOutput}, total: ${tokensTotal}, custo: R$ ${costBrl}`)

  const raw = result.response.text().trim()
  console.log('[gemini] resposta bruta:\n' + raw)

  const json = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  let transactions: unknown
  try {
    transactions = JSON.parse(json)
  } catch (parseErr) {
    console.error('[gemini.service] JSON.parse falhou. raw response:', raw)
    throw new Error(`Gemini retornou resposta invalida (nao e JSON): ${parseErr}`)
  }

  if (!Array.isArray(transactions)) {
    console.error('[gemini.service] Resposta nao e array. raw:', raw)
    throw new Error('Gemini retornou resposta em formato inesperado (esperado array)')
  }

  return {
    transactions,
    usage,
    ...(process.env.NODE_ENV !== 'production' && { raw }),
  }
}
