import React from 'react';
import { View, Text } from 'react-native';
import { CATEGORIES } from '../../data/mocks/transactions';
import { CategoryDot } from './CategoryDot';
import { fmtBRLShort } from '../../lib/currency';
import { Transaction } from '../../types/finance';
import { colors } from '../../theme/colors';

interface TxRowProps {
  tx: Transaction;
  last?: boolean;
}

export function TxRow({ tx, last = false }: TxRowProps) {
  const c = CATEGORIES[tx.cat] ?? CATEGORIES.shop;
  const isPos = tx.type === 'income';

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: colors.hairline,
    }}>
      <CategoryDot cat={tx.cat} />

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 15, fontWeight: '500', color: colors.ink }}
        >
          {tx.title}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
          {c.label} · {tx.date}
        </Text>
      </View>

      <Text style={{
        fontSize: 15,
        fontWeight: '500',
        color: isPos ? colors.pos : colors.ink,
        letterSpacing: -0.3,
      }}>
        {isPos ? '+' : '−'} {fmtBRLShort(tx.amount)}
      </Text>
    </View>
  );
}
