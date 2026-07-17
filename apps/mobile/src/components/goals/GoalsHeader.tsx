import React from 'react'
import { View, Text } from 'react-native'
import { Goal } from '../../types/finance'
import { colors } from '../../theme/colors'

interface GoalsHeaderProps {
  goals: Goal[]
}

export function GoalsHeader({ goals }: GoalsHeaderProps) {
  const active = goals.filter((g) => g.active)
  const completed = goals.filter((g) => !g.active)

  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 12, gap: 4 }}>
      <Text style={{ fontSize: 28, fontWeight: '500', color: colors.ink, letterSpacing: -0.8 }}>
        Metas
      </Text>
      <Text style={{ fontSize: 13, color: colors.muted }}>
        {active.length} {active.length === 1 ? 'ativa' : 'ativas'} · {completed.length} {completed.length === 1 ? 'concluída' : 'concluídas'}
      </Text>
    </View>
  )
}
