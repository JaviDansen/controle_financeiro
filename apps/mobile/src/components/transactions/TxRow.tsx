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
        opacity: pressed && onPress ? 0.6 : 1,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.hairline,
      })}
    >
      {/* View interna com o layout — evita NativeWind sobrescrever flexDirection no Pressable */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingVertical: 12,
      }}>
        {/* Ícone fixo à esquerda */}
        <View style={{
          width: 32, height: 32, borderRadius: 9,
          backgroundColor: catColor,
          alignItems: 'center', justifyContent: 'center',
          marginRight: 12,
          flexShrink: 0,
        }}>
          <LucideIcon size={15} color="#fff" strokeWidth={2} />
        </View>

        {/* Título e data */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ fontSize: 14, fontWeight: '500', color: colors.ink, lineHeight: 20 }}
          >
            {tx.title}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}
          >
            {tx.categoryName} · {tx.date}
          </Text>
        </View>

        {/* Valor ancorado à direita */}
        <Text style={{
          fontSize: 14,
          fontWeight: '500',
          color: isPos ? colors.pos : colors.ink,
          letterSpacing: -0.2,
          flexShrink: 0,
          marginLeft: 12,
        }}>
          {isPos ? '+' : '−'} R${fmtBRLShort(tx.amount)}
        </Text>
      </View>
    </Pressable>
  );
}
