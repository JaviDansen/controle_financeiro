import React from 'react'
import { View, Text } from 'react-native'
import { Icon } from '../ui/Icon'
import { fmtBRLShort } from '../../lib/currency'
import { colors } from '../../theme/colors'

interface TxSummaryCardsProps {
  totalIn: number
  totalOut: number
}

export function TxSummaryCards({ totalIn, totalOut }: TxSummaryCardsProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.hairline }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colors.pos, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.ArrowDn size={10} color="#FBFAF6" sw={2.5} />
          </View>
          <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase', fontWeight: '500', letterSpacing: 0.8 }}>Receitas</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '500', color: colors.ink, marginTop: 6, letterSpacing: -0.4 }}>
          R$ {fmtBRLShort(totalIn)}
        </Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.hairline }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colors.neg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon.ArrowUp size={10} color="#fff" sw={2.5} />
          </View>
          <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase', fontWeight: '500', letterSpacing: 0.8 }}>Despesas</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '500', color: colors.ink, marginTop: 6, letterSpacing: -0.4 }}>
          R$ {fmtBRLShort(totalOut)}
        </Text>
      </View>
    </View>
  )
}
