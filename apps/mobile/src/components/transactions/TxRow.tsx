import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { fmtBRLShort } from '../../lib/currency';
import { colors } from '../../theme/colors';
import { getCategoryIcon } from '../../lib/categoryIcons';

interface TxRowProps {
  tx: {
    id: string;
    title: string;
    amount: number;
    type: 'income' | 'expense';
    categoryName: string;
    categoryColor: string;
    categoryIcon?: string | null;
    date: string;
  };
  last?: boolean;
  onPress?: () => void;
}

export function TxRow({ tx, last = false, onPress }: TxRowProps) {
  const isPos = tx.type === 'income';
  const catColor = tx.categoryColor || '#8B8B92';
  const LucideIcon = getCategoryIcon(tx.categoryIcon);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.hairline,
        opacity: pressed && onPress ? 0.65 : 1,
      })}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: catColor,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <LucideIcon size={16} color="#fff" strokeWidth={2} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 15, fontWeight: '500', color: colors.ink }}
        >
          {tx.title}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
          {tx.categoryName} · {tx.date}
        </Text>
      </View>

      <Text style={{
        fontSize: 15,
        fontWeight: '500',
        color: isPos ? colors.pos : colors.ink,
        letterSpacing: -0.3,
        flexShrink: 0,
      }}>
        {isPos ? '+' : '−'} R${fmtBRLShort(tx.amount)}
      </Text>
    </Pressable>
  );
}
