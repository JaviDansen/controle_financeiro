import React, { useEffect, useRef } from 'react'
import { View, Text, Pressable, Animated } from 'react-native'
import { Goal } from '../../types/finance'
import { Icon } from '../ui/Icon'
import { colors } from '../../theme/colors'
import { fmtBRLShort } from '../../lib/currency'

interface GoalCardProps {
  goal: Goal
  onMorePress: () => void
  onApportPress: () => void
}

export function GoalCard({ goal, onMorePress, onApportPress }: GoalCardProps) {
  const pct = goal.target > 0 ? Math.min(1, goal.current / goal.target) : 0
  const remaining = goal.target - goal.current
  const done = goal.current >= goal.target

  const animWidth = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: pct,
      duration: 1000,
      useNativeDriver: false,
    }).start()
  }, [pct])

  const progressWidth = animWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  // Cores secundárias baseadas na cor primária da meta para o fundo do emoji
  // Se for código hex válido, podemos usar ou fallback para o padrão
  const emojiBgColor = goal.color ? `${goal.color}20` : 'rgba(21,21,26,0.06)'

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.hairline,
        borderRadius: 20,
        padding: 16,
        gap: 12,
      }}
    >
      {/* Top Row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Emoji Badge */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            backgroundColor: emojiBgColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18, color: goal.color }}>{goal.emoji}</Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 15,
              fontWeight: '500',
              color: colors.ink,
              letterSpacing: -0.2,
            }}
          >
            {goal.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            {done ? (
              <Text style={{ fontSize: 12, color: colors.pos, fontWeight: '500' }}>
                ● Concluída
              </Text>
            ) : (
              <>
                <Icon.Calendar size={11} color={colors.muted} />
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {goal.deadline}
                </Text>
                {goal.daysLeft !== null && (
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    · {goal.daysLeft} {goal.daysLeft === 1 ? 'dia' : 'dias'}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* More Actions button */}
        <Pressable
          onPress={onMorePress}
          hitSlop={8}
          style={({ pressed }) => ({
            padding: 6,
            borderRadius: 99,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Icon.More size={18} color={colors.muted} />
        </Pressable>
      </View>

      {/* Progress Section */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontSize: 17, fontWeight: '500', color: colors.ink, letterSpacing: -0.4 }}>
            R$ {fmtBRLShort(goal.current)}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            de R$ {fmtBRLShort(goal.target)}
          </Text>
        </View>

        {/* Animated Bar */}
        <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(21,21,26,0.06)', overflow: 'hidden' }}>
          <Animated.View
            style={{
              width: progressWidth,
              height: '100%',
              backgroundColor: done ? colors.pos : goal.color,
              borderRadius: 4,
            }}
          />
        </View>

        {/* Percentages and remaining */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <Text style={{ fontSize: 11, fontWeight: '500', color: done ? colors.pos : goal.color }}>
            {Math.round(pct * 100)}%
          </Text>
          {!done && (
            <Text style={{ fontSize: 11, color: colors.muted }}>
              Faltam R$ {fmtBRLShort(remaining)}
            </Text>
          )}
        </View>
      </View>

      {/* Quick Deposit button */}
      {!done && (
        <Pressable
          onPress={onApportPress}
          style={({ pressed }) => ({
            backgroundColor: 'rgba(21,21,26,0.04)',
            borderWidth: 1,
            borderColor: colors.hairline,
            borderRadius: 12,
            paddingVertical: 8,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >

          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }}>
            Aporte rápido
          </Text>
        </Pressable>
      )}
    </View>
  )
}
