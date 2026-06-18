import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/ui/Icon';
import { TxRow } from '../../src/components/transactions/TxRow';
import { useTransactions } from '../../hooks/useTransactions';
import { getCurrentMonth, getCurrentMonthParam } from '../../src/lib/date';
import { fmtBRLShort } from '../../src/lib/currency';
import { colors } from '../../src/theme/colors';
import { Transaction } from '../../services/transactions.service';

type TabKey = 'all' | 'income' | 'expense';

/* ─── TabPill ─────────────────────────────────────────────── */
function TabPill({
  active, onPress, children, count,
}: {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: active ? colors.ink : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '500', color: active ? '#FBFAF6' : colors.ink2 }}>
        {children}
      </Text>
      {count !== undefined && (
        <View style={{
          paddingHorizontal: 6, paddingVertical: 1,
          borderRadius: 999,
          backgroundColor: active ? 'rgba(255,255,255,0.18)' : colors.hairline,
        }}>
          <Text style={{ fontSize: 10, color: active ? '#FBFAF6' : colors.muted }}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/* ─── Skeleton linha ─────────────────────────────────────── */
function SkeletonRow() {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.hairline }} />
      <View style={{ gap: 6, flex: 1 }}>
        <View style={{ height: 14, borderRadius: 6, backgroundColor: colors.hairline, width: '55%' }} />
        <View style={{ height: 11, borderRadius: 6, backgroundColor: colors.hairline, width: '35%' }} />
      </View>
    </View>
  );
}

/* ─── Transactions Screen ─────────────────────────────────── */
export default function TransactionsScreen() {
  const [tab, setTab] = useState<TabKey>('all');
  const [showFilters, setShowFilters] = useState(false);

  const monthParam = getCurrentMonthParam();
  const currentMonth = getCurrentMonth();

  const { transactions, summary, isLoading, isError, refetch } = useTransactions(monthParam);

  const all = transactions ?? [];
  const incomes = all.filter(t => t.type === 'income');
  const expenses = all.filter(t => t.type === 'expense');

  const filtered = tab === 'all' ? all : tab === 'income' ? incomes : expenses;

  const totalIn = summary?.income ?? 0;
  const totalOut = summary?.expense ?? 0;

  // Agrupa por data
  const groups = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    (acc[tx.date] = acc[tx.date] ?? []).push(tx);
    return acc;
  }, {});
  const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 22,
          paddingTop: 8,
          paddingBottom: 12,
        }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '500', color: colors.ink, letterSpacing: -0.8 }}>
              Transações
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Icon.Calendar size={11} color={colors.muted} sw={1.6} />
              <Text style={{ fontSize: 12, color: colors.muted }}>{currentMonth}</Text>
              <Icon.ChevR size={10} color={colors.muted} sw={1.6} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: colors.surface,
              borderWidth: 1, borderColor: colors.hairline,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.Search size={18} color={colors.ink} />
            </Pressable>
            <Pressable
              onPress={() => setShowFilters(s => !s)}
              style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: showFilters ? colors.ink : colors.surface,
                borderWidth: 1, borderColor: colors.hairline,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon.Filter size={18} color={showFilters ? '#FBFAF6' : colors.ink} />
            </Pressable>
          </View>
        </View>

        {/* Mini cards receita / despesa */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}>
          <View style={{
            flex: 1, backgroundColor: colors.surface, borderRadius: 16,
            padding: 14, borderWidth: 1, borderColor: colors.hairline,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: colors.pos,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon.ArrowDn size={10} color="#FBFAF6" sw={2.5} />
              </View>
              <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase', fontWeight: '500', letterSpacing: 0.8 }}>
                Receitas
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '500', color: colors.ink, marginTop: 6, letterSpacing: -0.4 }}>
              R$ {fmtBRLShort(totalIn)}
            </Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: colors.surface, borderRadius: 16,
            padding: 14, borderWidth: 1, borderColor: colors.hairline,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: colors.neg,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon.ArrowUp size={10} color="#fff" sw={2.5} />
              </View>
              <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase', fontWeight: '500', letterSpacing: 0.8 }}>
                Despesas
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '500', color: colors.ink, marginTop: 6, letterSpacing: -0.4 }}>
              R$ {fmtBRLShort(totalOut)}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{
            flexDirection: 'row', gap: 4, padding: 4,
            backgroundColor: colors.surface, borderRadius: 16,
            borderWidth: 1, borderColor: colors.hairline,
          }}>
            <TabPill active={tab === 'all'} onPress={() => setTab('all')} count={all.length}>Todas</TabPill>
            <TabPill active={tab === 'income'} onPress={() => setTab('income')} count={incomes.length}>Receitas</TabPill>
            <TabPill active={tab === 'expense'} onPress={() => setTab('expense')} count={expenses.length}>Despesas</TabPill>
          </View>
        </View>

        {/* Estados */}
        {isError && (
          <Pressable onPress={() => refetch()} style={{ margin: 16, alignItems: 'center' }}>
            <Text style={{ color: colors.neg, fontSize: 13 }}>Erro ao carregar. Toque para tentar novamente.</Text>
          </Pressable>
        )}

        {/* Lista agrupada por data */}
        <View style={{ paddingTop: 16 }}>
          {isLoading ? (
            <View style={{
              marginHorizontal: 16,
              backgroundColor: colors.surface,
              borderRadius: 18,
              paddingHorizontal: 16,
              paddingTop: 4,
              borderWidth: 1, borderColor: colors.hairline,
            }}>
              {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
            </View>
          ) : dateKeys.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, color: colors.muted }}>Nenhuma transação este mês</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Toque em + para adicionar</Text>
            </View>
          ) : (
            dateKeys.map(dateKey => {
              const dayTxs = groups[dateKey];
              const dayIn = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
              const dayOut = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
              const net = dayIn - dayOut;

              return (
                <View key={dateKey} style={{ marginBottom: 16 }}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 26, paddingBottom: 8,
                  }}>
                    <Text style={{
                      fontSize: 11, color: colors.muted, fontWeight: '500',
                      textTransform: 'uppercase', letterSpacing: 1.2,
                    }}>
                      {dateKey}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      {net >= 0 ? '+' : '−'} R$ {fmtBRLShort(Math.abs(net))}
                    </Text>
                  </View>
                  <View style={{
                    marginHorizontal: 16,
                    backgroundColor: colors.surface,
                    borderRadius: 18,
                    paddingHorizontal: 16,
                    paddingTop: 4,
                    borderWidth: 1, borderColor: colors.hairline,
                  }}>
                    {dayTxs.map((tx, i) => (
                      <TxRow key={tx.id} tx={tx} last={i === dayTxs.length - 1} />
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
