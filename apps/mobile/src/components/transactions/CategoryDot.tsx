import React from 'react';
import { View, Text } from 'react-native';
import { CATEGORIES } from '../../data/mocks/transactions';
import { CategoryKey } from '../../types/finance';

interface CategoryDotProps {
  cat: CategoryKey;
  size?: number;
}

export function CategoryDot({ cat, size = 36 }: CategoryDotProps) {
  const c = CATEGORIES[cat] ?? CATEGORIES.shop;

  // cor de fundo: versão translúcida da cor da categoria
  const bgColor = c.color + '24'; // ~14% opacity

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2.4,
      backgroundColor: bgColor,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Text style={{
        fontSize: size * 0.42,
        fontWeight: '600',
        color: c.color,
      }}>
        {c.letter}
      </Text>
    </View>
  );
}
