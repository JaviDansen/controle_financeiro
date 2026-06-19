import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Icon } from '../ui/Icon'
import { colors } from '../../theme/colors'

interface CardsHeaderProps {
  totalCards: number
  creditCount: number
  onNewPress: () => void
}

export function CardsHeader({ totalCards, creditCount, onNewPress }: CardsHeaderProps) {
  return (
    <View>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 22, paddingTop: 8, paddingBottom: 4,
      }}>
        <Text style={{ fontSize: 28, fontWeight: '500', color: colors.ink, letterSpacing: -0.8 }}>
          Cartões
        </Text>
        <Pressable
          onPress={onNewPress}
          style={{
            height: 38, paddingHorizontal: 12, borderRadius: 999,
            backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: 6,
          }}
        >
          <Icon.Plus size={16} color="#FBFAF6" sw={2.2} />
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#FBFAF6' }}>Novo</Text>
        </Pressable>
      </View>
      <Text style={{ paddingHorizontal: 22, paddingBottom: 18, fontSize: 13, color: colors.muted }}>
        {totalCards} {totalCards === 1 ? 'cartão' : 'cartões'} — {creditCount} de crédito
      </Text>
    </View>
  )
}
