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
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.hairline,
        opacity: pressed && onPress ? 0.6 : 1,
      })}
    >
      {/* Ícone — mesma área fixa 32x32 do ProfileRow */}
      <View style={{
        width: 32, height: 32, borderRadius: 9,
        backgroundColor: catColor,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 12,
        flexShrink: 0,
      }}>
        <LucideIcon size={15} color="#fff" strokeWidth={2} />
      </View>

      {/* Bloco de texto com controle de largura */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}
        >
          {tx.title}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>
          {tx.categoryName} · {tx.date}
        </Text>
      </View>

      {/* Valor — nunca encolhe */}
      <Text style={{
        fontSize: 14,
        fontWeight: '500',
        color: isPos ? colors.pos : colors.ink,
        letterSpacing: -0.2,
        flexShrink: 0,
        marginLeft: 8,
      }}>
        {isPos ? '+' : '−'} R${fmtBRLShort(tx.amount)}
      </Text>
    </Pressable>
  );
}
