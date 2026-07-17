import React, { useState } from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { ScreenContainer } from '../../src/components/ui/ScreenContainer'
import { GoalsHeader } from '../../src/components/goals/GoalsHeader'
import { GoalCard } from '../../src/components/goals/GoalCard'
import { GoalsEmptyState } from '../../src/components/goals/GoalsEmptyState'
import { useGoals } from '../../hooks/useGoals'
import { Goal } from '../../src/types/finance'
import { colors } from '../../src/theme/colors'

export default function GoalsScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState<'active' | 'completed'>('active')

  const { data: goals = [], isLoading } = useGoals()

  const displayedGoals = goals.filter((g) => (filter === 'active' ? g.active : !g.active))

  return (
    <>
      <ScreenContainer>
        {isLoading ? (
          <View style={{ paddingVertical: 120, alignItems: 'center' }}>
            <ActivityIndicator color={colors.ink} size="large" />
          </View>
        ) : (
          <View style={{ gap: 20, paddingBottom: 32 }}>
            <GoalsHeader goals={goals} />

            {/* Filter Tabs */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10 }}>
              {(['active', 'completed'] as const).map((t) => {
                const isSelected = filter === t
                const label = t === 'active' ? 'Em andamento' : 'Concluídas'
                return (
                  <Pressable
                    key={t}
                    onPress={() => setFilter(t)}
                    style={({ pressed }) => ({
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: isSelected ? colors.ink : 'rgba(21,21,26,0.04)',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: isSelected ? '#FBFAF6' : colors.muted }}>
                      {label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {/* Goals List */}
            {displayedGoals.length === 0 ? (
              <GoalsEmptyState
                isFiltering={goals.length > 0}
                onNewPress={() => {
                  router.push('/(tabs)/add-goal')
                }}
              />
            ) : (
              <View style={{ paddingHorizontal: 16, gap: 12 }}>
                {displayedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onMorePress={() => {
                      router.push({
                        pathname: '/(tabs)/add-goal',
                        params: { id: goal.id }
                      })
                    }}
                    onApportPress={() => {
                      router.push({
                        pathname: '/(tabs)/apport',
                        params: { id: goal.id }
                      })
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScreenContainer>
    </>
  )
}
