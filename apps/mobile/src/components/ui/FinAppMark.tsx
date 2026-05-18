import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';

interface FinAppMarkProps {
  size?: number;
  dark?: boolean;
}

export function FinAppMark({ size = 32, dark = false }: FinAppMarkProps) {
  const ink = dark ? colors.surface : colors.ink;
  const dotSize = size * 0.18;
  const dotMarginH = size * 0.06;
  const dotMarginB = size * 0.06;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <Text style={{
        fontSize: size,
        fontWeight: '600',
        letterSpacing: -size * 0.04,
        lineHeight: size * 1.05,
        color: ink,
      }}>
        fin
      </Text>
      <View style={{
        width: dotSize,
        height: dotSize,
        borderRadius: dotSize / 2,
        backgroundColor: colors.accent,
        marginHorizontal: dotMarginH,
        marginBottom: dotMarginB,
      }} />
      <Text style={{
        fontSize: size,
        fontWeight: '600',
        letterSpacing: -size * 0.04,
        lineHeight: size * 1.05,
        color: ink,
      }}>
        app
      </Text>
    </View>
  );
}
