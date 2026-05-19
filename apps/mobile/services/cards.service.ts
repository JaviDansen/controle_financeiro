import { Card } from '../src/types/finance'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export interface CreateCardPayload {
  name: string
  bank: string
  type: 'credit' | 'debit'
  lastFour?: string
  holder?: string
  expiry?: string
  creditLimit?: number
  closingDay?: number
  dueDay?: number
  gradientFrom?: string
  gradientTo?: string
  accent?: string
}

export interface CreatedCard {
  id: string
  name: string
  bank: string | null
  type: string
  lastFour: string | null
  holder: string | null
  expiry: string | null
  creditLimit: string | null
  closingDay: number | null
  dueDay: number | null
  gradientFrom: string | null
  gradientTo: string | null
  accent: string | null
  createdAt: string
}

export async function getCards(token: string): Promise<Card[]> {
  const res = await fetch(`${API_URL}/cards`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar cartões')
  return json.data
}

export async function createCard(payload: CreateCardPayload, token: string): Promise<CreatedCard> {
  const res = await fetch(`${API_URL}/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao criar cartão')
  return json.data
}
