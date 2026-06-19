import { useMemo } from 'react'
import { Transaction } from '../services/transactions.service'

export type TabKey = 'all' | 'income' | 'expense'

export function useTransactionFilter(transactions: Transaction[], tab: TabKey) {
  return useMemo(() => {
    const all = transactions
    const incomes = all.filter(t => t.type === 'income')
    const expenses = all.filter(t => t.type === 'expense')
    const filtered = tab === 'all' ? all : tab === 'income' ? incomes : expenses

    const groups = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
      (acc[tx.date] = acc[tx.date] ?? []).push(tx)
      return acc
    }, {})
    const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))
    const counts = { all: all.length, income: incomes.length, expense: expenses.length }

    return { filtered, groups, dateKeys, counts }
  }, [transactions, tab])
}
