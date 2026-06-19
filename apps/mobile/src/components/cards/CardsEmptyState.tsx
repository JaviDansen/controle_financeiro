import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Icon } from '../ui/Icon'
import { colors } from '../../theme/colors'

interface CardsEmptyStateProps {
  onNewPress: () => void
}

export function CardsEmptyState({ onNewPress }: CardsEmptyStateProps) {
  return (
    <>
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
      <View style={{ paddingVertical: 80, alignItems: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22 }}>
          Você ainda não tem cartões cadastrados.{'\n'}Toque em Novo para adicionar.
        </Text>
      </View>
    </>
  )
}
