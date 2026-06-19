import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { colors } from '../../theme/colors'
import { TabKey } from '../../../hooks/useTransactionFilter'

interface TxTabBarProps {
  tab: TabKey
  counts: { all: number; income: number; expense: number }
  onTabChange: (tab: TabKey) => void
}

function TabPill({ active, onPress, children, count }: {
  active: boolean
  onPress: () => void
  children: React.ReactNode
  count?: number
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1, paddingVertical: 10, paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: active ? colors.ink : 'transparent',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '500', color: active ? '#FBFAF6' : colors.ink2 }}>
        {children}
      </Text>
      {count !== undefined && (
        <View style={{
          paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999,
          backgroundColor: active ? 'rgba(255,255,255,0.18)' : colors.hairline,
        }}>
          <Text style={{ fontSize: 10, color: active ? '#FBFAF6' : colors.muted }}>{count}</Text>
        </View>
      )}
    </Pressable>
  )
}

export function TxTabBar({ tab, counts, onTabChange }: TxTabBarProps) {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={{
        flexDirection: 'row', gap: 4, padding: 4,
        backgroundColor: colors.surface, borderRadius: 16,
        borderWidth: 1, borderColor: colors.hairline,
      }}>
        <TabPill active={tab === 'all'} onPress={() => onTabChange('all')} count={counts.all}>Todas</TabPill>
        <TabPill active={tab === 'income'} onPress={() => onTabChange('income')} count={counts.income}>Receitas</TabPill>
        <TabPill active={tab === 'expense'} onPress={() => onTabChange('expense')} count={counts.expense}>Despesas</TabPill>
      </View>
    </View>
  )
}
