import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth.store'
import { getTransactions, Transaction, MonthSummary } from '../services/transactions.service'

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
