import { useMemo } from 'react'
import { Transaction } from '../services/transactions.service'

export type TabKey = 'all' | 'income' | 'expense'

export type TxListItem =
  | { kind: 'date-header'; key: string; dateKey: string; net: number }
  | { kind: 'transaction-row'; key: string; tx: Transaction; isFirstOfGroup: boolean; isLastOfGroup: boolean }

// Contagens não dependem da aba selecionada — separadas do filtro para que
// o TxTabBar (que mostra os números e o estado "ativo" do botão) não fique
// preso ao mesmo useMemo pesado que recalcula groups/items a cada troca de aba.
export function useTransactionCounts(transactions: Transaction[]) {
  return useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of transactions) {
      if (t.type === 'income') income++
      else expense++
    }
    return { all: transactions.length, income, expense }
  }, [transactions])
}

// Saída linear pronta para FlatList — evita .map() aninhado (grupo > transações)
// no render e permite virtualizar item por item em vez de grupo por grupo.
export function useTransactionFilter(transactions: Transaction[], tab: TabKey) {
  return useMemo(() => {
    const filtered = tab === 'all'
      ? transactions
      : transactions.filter(t => t.type === tab)

    const groups = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
      (acc[tx.date] = acc[tx.date] ?? []).push(tx)
      return acc
    }, {})
    const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))

    const items: TxListItem[] = []
    for (const dateKey of dateKeys) {
      const group = groups[dateKey]
      const net = group.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
      items.push({ kind: 'date-header', key: `header-${dateKey}`, dateKey, net })
      group.forEach((tx, i) => {
        items.push({
          kind: 'transaction-row',
          key: tx.id,
          tx,
          isFirstOfGroup: i === 0,
          isLastOfGroup: i === group.length - 1,
        })
      })
    }

    return { filtered, groups, dateKeys, items }
  }, [transactions, tab])
}
