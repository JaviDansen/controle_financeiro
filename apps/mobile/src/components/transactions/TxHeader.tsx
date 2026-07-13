import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Icon } from '../ui/Icon'
import { colors } from '../../theme/colors'

interface TxHeaderProps {
  currentMonth: string
  onDeleteAll?: () => void
  disableDeleteAll?: boolean
}

export function TxHeader({ currentMonth, onDeleteAll, disableDeleteAll = false }: TxHeaderProps) {
  const router = useRouter()

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
        <Pressable
          onPress={() => router.push('/(tabs)/import-extract')}
          style={{
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: colors.ink,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon.Upload size={17} color="#FBFAF6" sw={1.8} />
        </Pressable>
        <Pressable
          onPress={onDeleteAll}
          disabled={disableDeleteAll}
          style={{
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: disableDeleteAll ? colors.hairline : '#FBE3E3',
            borderWidth: 1, borderColor: disableDeleteAll ? colors.hairline : '#E8B8B8',
            alignItems: 'center', justifyContent: 'center',
            opacity: disableDeleteAll ? 0.45 : 1,
          }}
        >
          <Icon.Trash size={17} color={disableDeleteAll ? colors.muted : '#B42318'} sw={1.8} />
        </Pressable>
      </View>
    </View>
  )
}
