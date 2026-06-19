const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export type TransactionType = 'income' | 'expense'
export type TransactionStatus = 'confirmed' | 'pending' | 'cancelled'

export interface Transaction {
  id: string
  title: string
  amount: number
  type: TransactionType
  status: TransactionStatus
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string | null
  cardId: string | null
  date: string
  notes: string | null
  isRecurring: boolean
  createdAt: string
}

export interface MonthSummary {
  income: number
  expense: number
  balance: number
  month: string
}

export interface MonthSummaryObject extends MonthSummary {
  label: string
}

export interface TransactionsResponse {
  summary: MonthSummary
  transactions: Transaction[]
}

export interface CreateTransactionPayload {
  title: string
  amount: number
  type: TransactionType
  categoryId: string
  cardId?: string | null
  date: string
  notes?: string
  isRecurring?: boolean
  status?: TransactionStatus
}

export async function getTransactions(month: string, token: string): Promise<TransactionsResponse> {
  const res = await fetch(`${API_URL}/transactions?month=${month}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar transações')
  return json.data
}

export async function createTransaction(
  payload: CreateTransactionPayload,
  token: string
): Promise<Transaction> {
  const res = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao criar transação')
  return json.data
}

export async function updateTransaction(
  id: string,
  payload: Partial<CreateTransactionPayload>,
  token: string
): Promise<Transaction> {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao atualizar transação')
  return json.data
}

export async function deleteTransaction(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const json = await res.json()
    throw new Error(json.error ?? 'Erro ao deletar transação')
  }
}
