import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { Transaction } from '../../../services/transactions.service';
import { HomeTxRow } from './HomeTxRow';

interface HomeTxListProps {
  items: Transaction[];
  isLoading: boolean;
}

function HomeTxSkeleton() {
  return (
    <View style={{ paddingVertical: 20, gap: 16 }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.hairline }} />
          <View style={{ gap: 6, flex: 1 }}>
            <View style={{ height: 14, borderRadius: 6, backgroundColor: colors.hairline, width: '60%' }} />
            <View style={{ height: 11, borderRadius: 6, backgroundColor: colors.hairline, width: '40%' }} />
          </View>
          <View style={{ height: 14, borderRadius: 6, backgroundColor: colors.hairline, width: 56 }} />
        </View>
      ))}
    </View>
  );
}

export function HomeTxList({ items, isLoading }: HomeTxListProps) {
  return (
    <View style={{
      marginHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingTop: 4,
      borderWidth: 1, borderColor: colors.hairline,
    }}>
      {isLoading ? (
        <HomeTxSkeleton />
      ) : items.length === 0 ? (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: colors.muted }}>Nenhuma transação este mês</Text>
        </View>
      ) : (
        items.map((tx, i) => (
          <HomeTxRow key={tx.id} tx={tx} last={i === items.length - 1} />
        ))
      )}
    </View>
  );
}
