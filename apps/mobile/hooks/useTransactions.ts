import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth.store'
import {
  getTransactions,
  deleteTransaction,
  updateTransaction,
  Transaction,
  MonthSummary,
  CreateTransactionPayload,
} from '../services/transactions.service'

export function useTransactions(month: string) {
  const token = useAuthStore(state => state.token)

  const query = useQuery({
    queryKey: ['transactions', month],
    queryFn: () => getTransactions(month, token!),
    enabled: !!token && !!month,
  })

  return {
    ...query,
    transactions: query.data?.transactions as Transaction[] | undefined,
    summary: query.data?.summary as MonthSummary | undefined,
  }
}

export function useDeleteTransaction(month: string) {
  const token = useAuthStore(state => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (txId: string) => deleteTransaction(txId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', month] })
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
    },
  })
}
