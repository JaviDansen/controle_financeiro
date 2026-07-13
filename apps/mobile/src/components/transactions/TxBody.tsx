import React from 'react'
import { View, Text } from 'react-native'
import { Icon } from '../ui/Icon'
import { colors } from '../../theme/colors'

// Dica de swipe exibida como footer da lista de transações — só faz sentido
// quando há itens, então quem decide se renderiza é o chamador (transactions.tsx).
export function TxListFooterHint() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16 }}>
      <Icon.ChevR size={11} color={colors.muted} sw={1.5} />
      <Text style={{ fontSize: 11, color: colors.muted }}>
        Deslize para a esquerda para excluir uma transação
      </Text>
    </View>
  )
}
