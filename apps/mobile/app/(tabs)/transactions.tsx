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

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmada', color: '#1E5229', bg: '#DDF0E4' },
  pending:   { label: 'Pendente',   color: '#5A4A10', bg: '#F5F0DC' },
  cancelled: { label: 'Cancelada',  color: '#7A2F10', bg: '#F7E8E0' },
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix', transfer: 'Transferência', boleto: 'Boleto',
};

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split('-');
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;
}

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
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: colors.hairline, flexShrink: 0 }} />
      <View style={{ gap: 5, flex: 1 }}>
        <View style={{ height: 14, borderRadius: 6, backgroundColor: colors.hairline, width: '55%' }} />
        <View style={{ height: 11, borderRadius: 6, backgroundColor: colors.hairline, width: '35%' }} />
      </View>
    </View>
  );
}

/* ─── DetailRow (modal de detalhes) ──────────────────────── */
function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 11,
      borderBottomWidth: 1, borderBottomColor: colors.hairline,
    }}>
      <Text style={{ fontSize: 13, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '500', color: valueColor ?? colors.ink }}>{value}</Text>
    </View>
  );
}

/* ─── Transactions Screen ─────────────────────────────────── */
export default function TransactionsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('all');
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [actionTx, setActionTx] = useState<Transaction | null>(null);

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

  function handleEdit(tx: Transaction) {
    setActionTx(null);
    setDetailTx(null);
    router.push({
      pathname: '/(tabs)/new-transaction',
      params: {
        txId: tx.id,
        type: tx.type,
        amount: tx.amount.toString(),
        title: tx.title,
        date: tx.date,
        categoryId: tx.categoryId,
        categoryName: tx.categoryName,
        categoryColor: tx.categoryColor,
        categoryIcon: tx.categoryIcon ?? '',
        cardId: tx.cardId ?? '',
        notes: tx.notes ?? '',
        isRecurring: tx.isRecurring ? '1' : '0',
        status: tx.status,
      },
    });
  }

  function handleDelete(tx: Transaction) {
    setActionTx(null);
    deleteMutation.mutate(tx.id);
  }

  const detailIcon = detailTx ? getCategoryIcon(detailTx.categoryIcon) : null;
  const actionIcon = actionTx ? getCategoryIcon(actionTx.categoryIcon) : null;
  const detailStatus = detailTx ? (STATUS_LABELS[detailTx.status] ?? STATUS_LABELS.confirmed) : null;

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
            <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.hairline }}>
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
                  <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.hairline }}>
                    {dayTxs.map((tx, i) => (
                      <TxRow
                        key={tx.id}
                        tx={tx}
                        last={i === dayTxs.length - 1}
                        onPress={() => setDetailTx(tx)}
                        onMorePress={() => setActionTx(tx)}
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

      {/* ── Modal de detalhes ──────────────────────────────────── */}
      <Modal
        visible={!!detailTx}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailTx(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(21,21,26,0.5)', justifyContent: 'center', paddingHorizontal: 20 }}
          onPress={() => setDetailTx(null)}
        >
          {/* Pressable interno para não fechar ao clicar dentro do card */}
          <Pressable onPress={() => {}}>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 24,
              overflow: 'hidden',
            }}>
              {/* Hero */}
              {detailTx && detailIcon && (() => {
                const isPos = detailTx.type === 'income';
                const typeColor = isPos ? colors.pos : colors.neg;
                const CatIcon = detailIcon;
                const statusInfo = detailStatus!;
                return (
                  <>
                    {/* Cabeçalho com X */}
                    <View style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
                    }}>
                      <View style={{
                        width: 40, height: 40, borderRadius: 12,
                        backgroundColor: detailTx.categoryColor,
                        alignItems: 'center', justifyContent: 'center',
                        marginRight: 12, flexShrink: 0,
                      }}>
                        <CatIcon size={18} color="#fff" strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>
                          {detailTx.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                          {detailTx.categoryName}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setDetailTx(null)}
                        style={{
                          width: 30, height: 30, borderRadius: 15,
                          backgroundColor: colors.hairline,
                          alignItems: 'center', justifyContent: 'center',
                          marginLeft: 8, flexShrink: 0,
                        }}
                      >
                        <Text style={{ fontSize: 16, color: colors.muted, lineHeight: 20 }}>×</Text>
                      </Pressable>
                    </View>

                    {/* Valor destacado */}
                    <View style={{
                      marginHorizontal: 20, marginBottom: 16,
                      backgroundColor: colors.bg, borderRadius: 14, padding: 16,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <View>
                        <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '500' }}>
                          {isPos ? 'Receita' : 'Despesa'}
                        </Text>
                        <Text style={{ fontSize: 26, fontWeight: '500', color: isPos ? colors.pos : colors.ink, letterSpacing: -0.8, marginTop: 2 }}>
                          {isPos ? '+' : '−'} R${fmtBRLShort(detailTx.amount)}
                        </Text>
                      </View>
                      <View style={{
                        paddingHorizontal: 10, paddingVertical: 5,
                        backgroundColor: statusInfo.bg, borderRadius: 999,
                      }}>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: statusInfo.color }}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    {/* Detalhes */}
                    <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
                      <DetailRow label="Data" value={formatDateBR(detailTx.date)} />
                      <DetailRow label="Categoria" value={detailTx.categoryName} />
                      {detailTx.cardId ? (
                        <DetailRow label="Pagamento" value="Cartão vinculado" />
                      ) : (
                        <DetailRow label="Pagamento" value="Sem vínculo" />
                      )}
                      <DetailRow label="Recorrente" value={detailTx.isRecurring ? 'Sim' : 'Não'} />
                      {detailTx.notes && (
                        <DetailRow label="Notas" value={detailTx.notes} />
                      )}
                    </View>

                    {/* Ações rápidas */}
                    <View style={{
                      flexDirection: 'row', gap: 8,
                      paddingHorizontal: 20, paddingVertical: 16,
                      borderTopWidth: 1, borderTopColor: colors.hairline,
                    }}>
                      <Pressable
                        onPress={() => { setDetailTx(null); handleEdit(detailTx); }}
                        style={({ pressed }) => ({
                          flex: 1, paddingVertical: 12, borderRadius: 12,
                          backgroundColor: colors.ink,
                          alignItems: 'center', justifyContent: 'center',
                          flexDirection: 'row', gap: 6,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Icon.Edit size={14} color="#FBFAF6" sw={2} />
                        <Text style={{ fontSize: 13, fontWeight: '500', color: '#FBFAF6' }}>Editar</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => { setDetailTx(null); handleDelete(detailTx); }}
                        style={({ pressed }) => ({
                          paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
                          backgroundColor: colors.negSoft,
                          alignItems: 'center', justifyContent: 'center',
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Icon.Trash size={15} color={colors.neg} sw={1.8} />
                      </Pressable>
                    </View>
                  </>
                );
              })()}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Action sheet (···) ─────────────────────────────────── */}
      <Modal
        visible={!!actionTx}
        transparent
        animationType="slide"
        onRequestClose={() => setActionTx(null)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(21,21,26,0.4)' }}
            onPress={() => setActionTx(null)}
          />
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            paddingBottom: 36, paddingTop: 12,
            paddingHorizontal: 16,
          }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: 'center', marginBottom: 16 }} />

            {/* Preview */}
            {actionTx && actionIcon && (() => {
              const AIcon = actionIcon;
              return (
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: colors.hairline,
                  borderRadius: 14, padding: 12, marginBottom: 8,
                }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 9,
                    backgroundColor: actionTx.categoryColor,
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 12, flexShrink: 0,
                  }}>
                    <AIcon size={15} color="#fff" strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>{actionTx.title}</Text>
                    <Text numberOfLines={1} style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>{actionTx.categoryName} · {actionTx.date}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '500', flexShrink: 0, marginLeft: 8, color: actionTx.type === 'income' ? colors.pos : colors.ink, letterSpacing: -0.2 }}>
                    {actionTx.type === 'income' ? '+' : '−'} R${fmtBRLShort(actionTx.amount)}
                  </Text>
                </View>
              );
            })()}

            <View style={{ height: 1, backgroundColor: colors.hairline, marginBottom: 4 }} />

            {/* Editar */}
            <Pressable onPress={() => actionTx && handleEdit(actionTx)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: colors.hairline, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Icon.Edit size={15} color={colors.ink} sw={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>Editar transação</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>Alterar dados, categoria ou valor</Text>
                </View>
                <Icon.ChevR size={13} color={colors.muted} sw={1.8} />
              </View>
            </Pressable>

            <View style={{ height: 1, backgroundColor: colors.hairline }} />

            {/* Excluir */}
            <Pressable
              onPress={() => actionTx && handleDelete(actionTx)}
              disabled={deleteMutation.isPending}
              style={({ pressed }) => ({ opacity: pressed || deleteMutation.isPending ? 0.6 : 1 })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: colors.negSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Icon.Trash size={15} color={colors.neg} sw={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.neg }}>
                    {deleteMutation.isPending ? 'Excluindo...' : 'Excluir transação'}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.neg, opacity: 0.6, marginTop: 1 }}>Esta ação não pode ser desfeita</Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
