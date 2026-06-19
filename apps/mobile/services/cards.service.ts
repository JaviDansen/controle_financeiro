const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

interface BaseCard {
  id: string
  name: string
  bank: string | null
  last4: string | null
  holder: string | null
  expiry: string | null
  gradientColors: [string, string]
  accent: string | null
}

export interface CreditCard extends BaseCard {
  type: 'credit'
  limit: number | null
  used: number
  currentMonthTotal: number
  closingDay: number | null
  dueDay: number | null
  bestPurchaseDate: string | null
  openInstallmentsCount: number
  openInstallmentsTotal: number
}

export interface DebitCard extends BaseCard {
  type: 'debit'
  monthlySpent: number
}

export type Card = CreditCard | DebitCard

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

export type UpdateCardPayload = CreateCardPayload

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
  if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar cartoes')
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
  if (!res.ok) throw new Error(json.error ?? 'Erro ao criar cartao')
  return json.data
}

export async function updateCard(id: string, payload: UpdateCardPayload, token: string): Promise<CreatedCard> {
  const res = await fetch(`${API_URL}/cards/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao atualizar cartao')
  return json.data
}

export interface BlockedTransaction {
  id: string
  title: string
  amount: number
  type: 'income' | 'expense'
  date: string
}

export class CardHasTransactionsError extends Error {
  transactions: BlockedTransaction[]
  constructor(transactions: BlockedTransaction[]) {
    super('Cartao possui transacoes vinculadas')
    this.name = 'CardHasTransactionsError'
    this.transactions = transactions
  }
}

export async function deleteCard(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/cards/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const json = await res.json()
    if (res.status === 409 && json.transactions) {
      throw new CardHasTransactionsError(json.transactions)
    }
    throw new Error(json.error ?? 'Erro ao excluir cartao')
  }
}
