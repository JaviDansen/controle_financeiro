import { readFile } from 'fs/promises'
import { geminiClient, GEMINI_MODEL } from '../gemini.client'
import { ValidationResult } from '../types'

export async function validateWithGemini(imagePath: string): Promise<ValidationResult> {
  const model = geminiClient.getGenerativeModel({ model: GEMINI_MODEL })

  const imageBuffer = await readFile(imagePath)
  const imageBase64 = imageBuffer.toString('base64')

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    },
    {
      text: 'Esta imagem contém um cabeçalho de data (como "Hoje", "19 de junho", "31 de maio") separando grupos de transações financeiras? Se sim, responda "sim: <data encontrada>" (ex: "sim: 19 de junho"). Se não, responda apenas "não".',
    },
  ])

  const usage = result.response.usageMetadata
  console.log(`[gemini:validator] tokens — prompt: ${usage?.promptTokenCount}, output: ${usage?.candidatesTokenCount}, total: ${usage?.totalTokenCount}`)

  const answer = result.response.text().trim().toLowerCase()
  const valid = answer.startsWith('sim')

  let detectedDate: string | undefined
  if (valid) {
    const match = answer.match(/^sim:\s*(.+)$/)
    detectedDate = match?.[1]?.trim()
  }

  return {
    valid,
    detectedDate,
    reason: valid ? undefined : 'Nenhum cabeçalho de data encontrado na imagem',
  }
}
