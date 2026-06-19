import React from 'react'
import { View, Text } from 'react-native'
import { fmtBRLShort } from '../../lib/currency'
import { colors } from '../../theme/colors'
import { Transaction } from '../../../services/transactions.service'
import { TxRow } from './TxRow'
import { SwipeableRow } from './SwipeableRow'

interface TxDateGroupProps {
  dateKey: string
  transactions: Transaction[]
  onPress: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
}

export function TxDateGroup({ dateKey, transactions, onPress, onDelete }: TxDateGroupProps) {
  const dayIn = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const dayOut = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = dayIn - dayOut

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 26, paddingBottom: 8 }}>
        <Text style={{ fontSize: 11, color: colors.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1.2 }}>
          {dateKey}
        </Text>
        <Text style={{ fontSize: 11, color: colors.muted }}>
          {net >= 0 ? '+' : '−'} R$ {fmtBRLShort(Math.abs(net))}
        </Text>
      </View>
      <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.hairline }}>
        {transactions.map((tx, i) => (
          <SwipeableRow key={tx.id} onDelete={() => onDelete(tx)}>
            <View style={{ paddingHorizontal: 16, backgroundColor: colors.surface }}>
              <TxRow
                tx={tx}
                last={i === transactions.length - 1}
                onPress={() => onPress(tx)}
              />
            </View>
          </SwipeableRow>
        ))}
      </View>
    </View>
  )
}
