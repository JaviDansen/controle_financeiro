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
      text: 'Esta imagem contém um cabeçalho de data (como "Hoje", "19 de junho", "31 de maio") separando grupos de transações financeiras? Responda apenas "sim" ou "não".',
    },
  ])

  const usage = result.response.usageMetadata
  console.log(`[gemini:validator] tokens — prompt: ${usage?.promptTokenCount}, output: ${usage?.candidatesTokenCount}, total: ${usage?.totalTokenCount}`)

  const answer = result.response.text().trim().toLowerCase()
  const valid = answer.startsWith('sim')

  return {
    valid,
    reason: valid ? undefined : 'Nenhum cabeçalho de data encontrado na imagem',
  }
}
