import React from 'react'
import { View, Text } from 'react-native'
import { colors } from '../../theme/colors'

interface TxDetailRowProps {
  label: string
  value: string
  valueColor?: string
}

export function TxDetailRow({ label, value, valueColor }: TxDetailRowProps) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 11,
      borderBottomWidth: 1, borderBottomColor: colors.hairline,
    }}>
      <Text style={{ fontSize: 13, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '500', color: valueColor ?? colors.ink }}>{value}</Text>
    </View>
  )
}
