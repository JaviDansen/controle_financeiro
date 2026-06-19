import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Icon } from '../ui/Icon'
import { colors } from '../../theme/colors'

interface TxHeaderProps {
  currentMonth: string
}

export function TxHeader({ currentMonth }: TxHeaderProps) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12,
    }}>
      <View>
        <Text style={{ fontSize: 28, fontWeight: '500', color: colors.ink, letterSpacing: -0.8 }}>
          Transações
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Icon.Calendar size={11} color={colors.muted} sw={1.6} />
          <Text style={{ fontSize: 12, color: colors.muted }}>{currentMonth}</Text>
          <Icon.ChevR size={10} color={colors.muted} sw={1.6} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable style={{
          width: 38, height: 38, borderRadius: 19,
          backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.Search size={18} color={colors.ink} />
        </Pressable>
        <Pressable style={{
          width: 38, height: 38, borderRadius: 19,
          backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.Filter size={18} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  )
}
