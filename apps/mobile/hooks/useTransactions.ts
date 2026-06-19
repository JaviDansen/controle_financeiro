import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth.store'
import {
  getTransactions,
  deleteTransaction,
  updateTransaction,
  Transaction,
  MonthSummary,
  MonthSummaryObject,
  CreateTransactionPayload,
} from '../services/transactions.service'
import { getCurrentMonth } from '../src/lib/date'

export function useTransactions(month: string) {
  const token = useAuthStore(state => state.token)

  const query = useQuery({
    queryKey: ['transactions', month],
    queryFn: () => getTransactions(month, token!),
    enabled: !!token && !!month,
  })

  const monthSummary: MonthSummaryObject | undefined = query.data?.summary
    ? { ...query.data.summary, label: getCurrentMonth() }
    : undefined

  const allTransactions = query.data?.transactions ?? []
  const recentTransactions = {
    items: allTransactions.slice(0, 5),
    total: allTransactions.length,
    hasMore: allTransactions.length > 5,
  }

  const sparkData = useMemo(() => {
    if (!allTransactions.length) return Array(14).fill(0)
    const today = new Date()
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (13 - i))
      const key = d.toISOString().slice(0, 10)
      return allTransactions
        .filter(t => t.type === 'expense' && t.date === key)
        .reduce((s, t) => s + t.amount, 0)
    })
  }, [allTransactions])

  return {
    ...query,
    transactions: query.data?.transactions as Transaction[] | undefined,
    summary: query.data?.summary as MonthSummary | undefined,
    monthSummary,
    recentTransactions,
    sparkData,
  }
}

export function useDeleteTransaction(month: string) {
  const token = useAuthStore(state => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (txId: string) => deleteTransaction(txId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', month] })
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    },
  })
}

export function useUpdateTransaction(month: string) {
  const token = useAuthStore(state => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateTransactionPayload> }) =>
      updateTransaction(id, payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', month] })
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    },
  })
}
