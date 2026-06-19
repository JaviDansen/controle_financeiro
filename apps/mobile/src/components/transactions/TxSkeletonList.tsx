import React from 'react'
import { View } from 'react-native'
import { colors } from '../../theme/colors'

function SkeletonRow() {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.hairline, flexShrink: 0 }} />
      <View style={{ gap: 5, flex: 1 }}>
        <View style={{ height: 14, borderRadius: 6, backgroundColor: colors.hairline, width: '55%' }} />
        <View style={{ height: 11, borderRadius: 6, backgroundColor: colors.hairline, width: '35%' }} />
      </View>
    </View>
  )
}

export function TxSkeletonList() {
  return (
    <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.hairline }}>
      {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
    </View>
  )
}
