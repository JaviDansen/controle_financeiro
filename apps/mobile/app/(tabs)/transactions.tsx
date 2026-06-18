import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '../../src/components/ui/Icon';
import { TxRow } from '../../src/components/transactions/TxRow';
import { useTransactions, useDeleteTransaction } from '../../hooks/useTransactions';
import { getCurrentMonth, getCurrentMonthParam } from '../../src/lib/date';
import { fmtBRLShort } from '../../src/lib/currency';
import { colors } from '../../src/theme/colors';
import { Transaction } from '../../services/transactions.service';
import { getCategoryIcon } from '../../src/lib/categoryIcons';

type TabKey = 'all' | 'income' | 'expense';

/* ─── TabPill ─────────────────────────────────────────────── */
function TabPill({ active, onPress, children, count }: {
  active: boolean; onPress: () => void;
  children: React.ReactNode; count?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1, paddingVertical: 10, paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: active ? colors.ink : 'transparent',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '500', color: active ? '#FBFAF6' : colors.ink2 }}>
        {children}
      </Text>
      {count !== undefined && (
        <View style={{
          paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999,
          backgroundColor: active ? 'rgba(255,255,255,0.18)' : colors.hairline,
        }}>
          <Text style={{ fontSize: 10, color: active ? '#FBFAF6' : colors.muted }}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

/* ─── Skeleton ────────────────────────────────────────────── */
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
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const monthParam = getCurrentMonthParam();
  const currentMonth = getCurrentMonth();

  const { transactions, summary, isLoading, isError, refetch } = useTransactions(monthParam);
  const deleteMutation = useDeleteTransaction(monthParam);

  const all = transactions ?? [];
  const incomes = all.filter(t => t.type === 'income');
  const expenses = all.filter(t => t.type === 'expense');
  const filtered = tab === 'all' ? all : tab === 'income' ? incomes : expenses;

  const totalIn = summary?.income ?? 0;
  const totalOut = summary?.expense ?? 0;

  const groups = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    (acc[tx.date] = acc[tx.date] ?? []).push(tx);
    return acc;
  }, {});
  const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  function handleEdit() {
    if (!selectedTx) return;
    setSelectedTx(null);
    router.push({
      pathname: '/(tabs)/new-transaction',
      params: {
        txId: selectedTx.id,
        type: selectedTx.type,
        amount: selectedTx.amount.toString(),
        title: selectedTx.title,
        date: selectedTx.date,
        categoryId: selectedTx.categoryId,
        categoryName: selectedTx.categoryName,
        categoryColor: selectedTx.categoryColor,
        categoryIcon: selectedTx.categoryIcon ?? '',
        cardId: selectedTx.cardId ?? '',
        notes: selectedTx.notes ?? '',
        isRecurring: selectedTx.isRecurring ? '1' : '0',
        status: selectedTx.status,
      },
    });
  }

  function handleDelete() {
    if (!selectedTx) return;
    const tx = selectedTx;
    setSelectedTx(null);
    deleteMutation.mutate(tx.id);
  }

  const CatIcon = selectedTx ? getCategoryIcon(selectedTx.categoryIcon) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12,
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
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.Search size={18} color={colors.ink} />
            </Pressable>
            <Pressable style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.Filter size={18} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        {/* Mini cards receita / despesa */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.hairline }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colors.pos, alignItems: 'center', justifyContent: 'center' }}>
                <Icon.ArrowDn size={10} color="#FBFAF6" sw={2.5} />
              </View>
              <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase', fontWeight: '500', letterSpacing: 0.8 }}>Receitas</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '500', color: colors.ink, marginTop: 6, letterSpacing: -0.4 }}>
              R$ {fmtBRLShort(totalIn)}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.hairline }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colors.neg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon.ArrowUp size={10} color="#fff" sw={2.5} />
              </View>
              <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase', fontWeight: '500', letterSpacing: 0.8 }}>Despesas</Text>
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

        {isError && (
          <Pressable onPress={() => refetch()} style={{ margin: 16, alignItems: 'center' }}>
            <Text style={{ color: colors.neg, fontSize: 13 }}>Erro ao carregar. Toque para tentar novamente.</Text>
          </Pressable>
        )}

        {/* Lista */}
        <View style={{ paddingTop: 16 }}>
          {isLoading ? (
            <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 16, paddingTop: 4, borderWidth: 1, borderColor: colors.hairline }}>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 26, paddingBottom: 8 }}>
                    <Text style={{ fontSize: 11, color: colors.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                      {dateKey}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      {net >= 0 ? '+' : '−'} R$ {fmtBRLShort(Math.abs(net))}
                    </Text>
                  </View>
                  <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 16, paddingTop: 4, borderWidth: 1, borderColor: colors.hairline }}>
                    {dayTxs.map((tx, i) => (
                      <TxRow
                        key={tx.id}
                        tx={tx}
                        last={i === dayTxs.length - 1}
                        onPress={() => setSelectedTx(tx)}
                      />
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Action Sheet */}
      <Modal
        visible={!!selectedTx}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(21,21,26,0.4)' }}
            onPress={() => setSelectedTx(null)}
          />
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            paddingBottom: 36, paddingTop: 12,
          }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: 'center', marginBottom: 16 }} />

            {/* Preview da transação */}
            {selectedTx && (
              <View style={{
                marginHorizontal: 16, marginBottom: 12,
                backgroundColor: colors.bg, borderRadius: 16,
                padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
                {CatIcon && (
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: selectedTx.categoryColor,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CatIcon size={18} color="#fff" strokeWidth={2} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: colors.ink }} numberOfLines={1}>
                    {selectedTx.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                    {selectedTx.categoryName} · {selectedTx.date}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 16, fontWeight: '500',
                  color: selectedTx.type === 'income' ? colors.pos : colors.ink,
                  letterSpacing: -0.4,
                }}>
                  {selectedTx.type === 'income' ? '+' : '−'} R$ {fmtBRLShort(selectedTx.amount)}
                </Text>
              </View>
            )}

            {/* Editar */}
            <Pressable
              onPress={handleEdit}
              style={({ pressed }) => ({
                height: 52, flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 20, gap: 14,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 11,
                backgroundColor: colors.hairline,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon.Tx size={16} color={colors.ink} sw={1.8} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: colors.ink }}>
                Editar transação
              </Text>
              <Icon.ChevR size={14} color={colors.muted} sw={1.8} />
            </Pressable>

            {/* Separador */}
            <View style={{ height: 1, backgroundColor: colors.hairline, marginHorizontal: 20, marginVertical: 4 }} />

            {/* Excluir */}
            <Pressable
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
              style={({ pressed }) => ({
                height: 52, flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 20, gap: 14,
                opacity: pressed || deleteMutation.isPending ? 0.6 : 1,
              })}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 11,
                backgroundColor: '#FDECEA',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon.Filter size={16} color={colors.neg} sw={1.8} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: colors.neg }}>
                {deleteMutation.isPending ? 'Removendo...' : 'Excluir transação'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
