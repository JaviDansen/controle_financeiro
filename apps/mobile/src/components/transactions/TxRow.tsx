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
  onMorePress?: () => void;
}

export function TxRow({ tx, last = false, onPress, onMorePress }: TxRowProps) {
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

        {/* Título e categoria */}
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

        {/* Valor */}
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

        {/* Botão ··· */}
        <Pressable
          onPress={onMorePress}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 0 }}
          style={({ pressed }) => ({
            marginLeft: 8,
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: pressed ? colors.hairline : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          })}
        >
          <Text style={{ fontSize: 14, color: colors.muted, letterSpacing: 1, lineHeight: 16 }}>···</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
