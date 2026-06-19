import React from 'react'
import { View, Text } from 'react-native'
import { Icon } from '../ui/Icon'
import { colors } from '../../theme/colors'
import { Transaction } from '../../../services/transactions.service'
import { TxSkeletonList } from './TxSkeletonList'
import { TxEmptyState } from './TxEmptyState'
import { TxDateGroup } from './TxDateGroup'

interface TxBodyProps {
  isLoading: boolean
  dateKeys: string[]
  groups: Record<string, Transaction[]>
  onPress: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
}

export function TxBody({ isLoading, dateKeys, groups, onPress, onDelete }: TxBodyProps) {
  return (
    <View style={{ paddingTop: 16 }}>
      {isLoading ? (
        <TxSkeletonList />
      ) : dateKeys.length === 0 ? (
        <TxEmptyState />
      ) : (
        <>
          {dateKeys.map(dateKey => (
            <TxDateGroup
              key={dateKey}
              dateKey={dateKey}
              transactions={groups[dateKey]}
              onPress={onPress}
              onDelete={onDelete}
            />
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingBottom: 8 }}>
            <Icon.ChevR size={11} color={colors.muted} sw={1.5} />
            <Text style={{ fontSize: 11, color: colors.muted }}>
              Deslize para a esquerda para excluir uma transação
            </Text>
          </View>
        </>
      )}
    </View>
  )
}
