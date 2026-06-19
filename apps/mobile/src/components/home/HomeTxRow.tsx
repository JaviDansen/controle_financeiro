import React from 'react';
import { View, Text } from 'react-native';
import { fmtBRLShort } from '../../lib/currency';
import { colors } from '../../theme/colors';
import { getCategoryIcon } from '../../lib/categoryIcons';
import { Transaction } from '../../../services/transactions.service';

interface HomeTxRowProps {
  tx: Transaction;
  last?: boolean;
}

export function HomeTxRow({ tx, last = false }: HomeTxRowProps) {
  const isPos = tx.type === 'income';
  const catColor = tx.categoryColor || '#8B8B92';
  const LucideIcon = getCategoryIcon(tx.categoryIcon);

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 72,
      paddingVertical: 14,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: colors.hairline,
    }}>
      <View style={{
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: catColor,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
        flexShrink: 0,
      }}>
        <LucideIcon size={20} color="#fff" strokeWidth={2} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ fontSize: 16, fontWeight: '500', color: colors.ink, lineHeight: 22 }}
        >
          {tx.title}
        </Text>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ fontSize: 13, color: colors.muted, lineHeight: 20, marginTop: 1 }}
        >
          {tx.categoryName} · {tx.date}
        </Text>
      </View>

      <Text style={{
        fontSize: 16,
        fontWeight: '600',
        color: isPos ? colors.pos : colors.ink,
        letterSpacing: -0.3,
        flexShrink: 0,
        marginLeft: 14,
      }}>
        {isPos ? '+' : '−'} R${fmtBRLShort(tx.amount)}
      </Text>
    </View>
  );
}
