import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY não configurada no .env')
}

export const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
