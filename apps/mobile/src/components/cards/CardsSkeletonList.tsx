import React from 'react'
import { View } from 'react-native'
import { colors } from '../../theme/colors'

export function CardsSkeletonList() {
  return (
    <View>
      <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 4 }}>
        <View style={{ height: 30, width: 140, borderRadius: 8, backgroundColor: colors.hairline }} />
      </View>
      <View style={{ paddingHorizontal: 22, paddingBottom: 18 }}>
        <View style={{ height: 14, width: 180, borderRadius: 6, backgroundColor: colors.hairline }} />
      </View>

      <View style={{ flexDirection: 'row', paddingLeft: 16, gap: 12 }}>
        {[1, 2].map(i => (
          <View
            key={i}
            style={{ width: 280, height: 180, borderRadius: 24, backgroundColor: colors.hairline }}
          />
        ))}
      </View>

      <View style={{ marginHorizontal: 16, marginTop: 20, borderRadius: 18, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, gap: 10 }}>
        <View style={{ height: 14, width: '50%', borderRadius: 6, backgroundColor: colors.hairline }} />
        <View style={{ height: 14, width: '70%', borderRadius: 6, backgroundColor: colors.hairline }} />
        <View style={{ height: 14, width: '40%', borderRadius: 6, backgroundColor: colors.hairline }} />
      </View>
    </View>
  )
}
