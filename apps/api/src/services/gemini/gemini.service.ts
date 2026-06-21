import { readFile } from 'fs/promises'
import { join } from 'path'
import { geminiClient, GEMINI_MODEL } from './gemini.client'
import { getPrompt } from './prompts'
import { ExtractionResult, GeminiUsage, ImportFormat, SupportedBank } from './types'
import { getUsdToBrl } from '../exchange-rate.service'

// Raiz da app (apps/api/) — funciona tanto em ts-node (src/) quanto em build (dist/)
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
  filePath: string    // caminho relativo: "data_import/images/{userId}/{imageId}.jpg"
  bank: SupportedBank
  format: ImportFormat
}): Promise<ExtractionResult> {
  const { filePath, bank, format } = params

  const absolutePath = join(API_ROOT, filePath)
  const imageBuffer = await readFile(absolutePath)
  const imageBase64 = imageBuffer.toString('base64')

  const prompt = getPrompt(bank, format)
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
  console.log(`[gemini] tokens — prompt: ${tokensPrompt}, output: ${tokensOutput}, total: ${tokensTotal}, custo: R$ ${costBrl}`)

  const raw = result.response.text().trim()

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
    throw new Error(`Gemini retornou resposta inválida (não é JSON): ${parseErr}`)
  }

  if (!Array.isArray(transactions)) {
    console.error('[gemini.service] Resposta não é array. raw:', raw)
    throw new Error('Gemini retornou resposta em formato inesperado (esperado array)')
  }

  return {
    transactions,
    usage,
    ...(process.env.NODE_ENV !== 'production' && { raw }),
  }
}
