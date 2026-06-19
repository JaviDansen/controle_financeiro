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
      {/* View interna — evita NativeWind sobrescrever flexDirection no Pressable */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 72,
        paddingVertical: 14,
      }}>
        {/* Ícone */}
        <View style={{
          width: 42, height: 42, borderRadius: 12,
          backgroundColor: catColor,
          alignItems: 'center', justifyContent: 'center',
          marginRight: 14,
          flexShrink: 0,
        }}>
          <LucideIcon size={20} color="#fff" strokeWidth={2} />
        </View>

        {/* Título e categoria */}
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

        {/* Valor */}
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
    </Pressable>
  );
}
