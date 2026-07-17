import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Icon } from '../ui/Icon'
import { colors } from '../../theme/colors'

interface GoalsEmptyStateProps {
  onNewPress: () => void
  isFiltering?: boolean
}

export function GoalsEmptyState({ onNewPress, isFiltering = false }: GoalsEmptyStateProps) {
  return (
    <View style={{ paddingVertical: 80, alignItems: 'center', paddingHorizontal: 40 }}>
      <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22 }}>
        {isFiltering
          ? 'Nenhuma meta encontrada para este filtro.'
          : 'Você ainda não tem metas financeiras cadastradas.\nToque em "Nova meta" para começar a poupar!'}
      </Text>
      {!isFiltering && (
        <Pressable
          onPress={onNewPress}
          style={({ pressed }) => ({
            marginTop: 20,
            height: 42,
            paddingHorizontal: 20,
            borderRadius: 999,
            backgroundColor: colors.ink,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            opacity: pressed ? 0.8 : 1
          })}
        >
          <Icon.Plus size={16} color="#FBFAF6" sw={2.2} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#FBFAF6' }}>Criar minha primeira meta</Text>
        </Pressable>
      )}
    </View>
  )
}
