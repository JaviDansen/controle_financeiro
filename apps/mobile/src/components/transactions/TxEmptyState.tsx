import React from 'react'
import { View, Text } from 'react-native'
import { colors } from '../../theme/colors'

export function TxEmptyState() {
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center' }}>
      <Text style={{ fontSize: 15, color: colors.muted }}>Nenhuma transação este mês</Text>
      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Toque em + para adicionar</Text>
    </View>
  )
}
