import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '../../src/components/ui/Icon';
import { TxRow } from '../../src/components/transactions/TxRow';
import { useTransactions } from '../../hooks/useTransactions';
import { useCards } from '../../hooks/useCards';
import { useAuthStore } from '../../store/auth.store';
import { getCurrentMonth, getCurrentMonthParam } from '../../src/lib/date';
import { fmtBRLShort } from '../../src/lib/currency';
import { colors } from '../../src/theme/colors';
import { Card } from '../../src/types/finance';

/* ─── Mini gráfico de barras ─────────────────────────────── */
function Sparkbars({ data, barColor = '#FBFAF6', height = 32 }: { data: number[]; barColor?: string; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: Math.max((v / max) * height, v > 0 ? 3 : 2),
            backgroundColor: v > 0 ? barColor : 'rgba(255,255,255,0.15)',
            borderRadius: 2,
            opacity: v > 0 ? 0.5 + (i / data.length) * 0.5 : 1,
          }}
        />
      ))}
    </View>
  );
}

/* ─── Mini card de crédito (carrossel) ───────────────────── */
function MiniCardSummary({ card, onTap }: { card: Card; onTap?: () => void }) {
  return (
    <Pressable
      onPress={onTap}
      style={{
        width: 220,
        backgroundColor: card.gradientColors[0],
        borderRadius: 18,
        padding: 16,
        minHeight: 130,
        justifyContent: 'space-between',
        overflow: 'hidden',
        marginRight: 12,
      }}
    >
      <View style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: card.accent ?? '#fff',
        opacity: 0.18,
      }} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {card.bank}
          </Text>
          <Text style={{ fontSize: 15, color: '#fff', fontWeight: '500', marginTop: 2 }}>
            {card.name}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
          •• {card.last4}
        </Text>
      </View>

      <View style={{ marginTop: 'auto' }}>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Fatura atual</Text>
        <Text style={{ fontSize: 20, fontWeight: '500', color: '#fff', letterSpacing: -0.4, marginTop: 2 }}>
          R$ {fmtBRLShort(card.currentMonthTotal)}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{card.openInstallmentsCount} parcelas</Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Fecha dia {card.closingDay}</Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ─── Skeleton simples ───────────────────────────────────── */
function SkeletonBlock({ w, h, radius = 8 }: { w: number | string; h: number; radius?: number }) {
  return (
    <View style={{
      width: w as number,
      height: h,
      borderRadius: radius,
      backgroundColor: 'rgba(255,255,255,0.10)',
    }} />
  );
}

/* ─── Dashboard ──────────────────────────────────────────── */
export default function HomeScreen() {
  const router = useRouter();
  const [showBalance, setShowBalance] = useState(true);
  const user = useAuthStore(state => state.user);

  const currentMonth = getCurrentMonth();
  const monthParam = getCurrentMonthParam();

  const { summary, transactions, isLoading, isError, refetch } = useTransactions(monthParam);
  const { data: cards, isLoading: cardsLoading } = useCards();

  const recent = transactions?.slice(0, 5) ?? [];
  const creditCards = cards?.filter(c => c.type === 'credit') ?? [];
  const income = summary?.income ?? 0;
  const expense = summary?.expense ?? 0;
  const balance = summary?.balance ?? 0;

  // Sparkbars: agrupa despesas por dia (últimos 14 dias)
  const sparkData = React.useMemo(() => {
    if (!transactions) return Array(14).fill(0);
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (13 - i));
      const key = d.toISOString().slice(0, 10);
      return transactions
        .filter(t => t.type === 'expense' && t.date === key)
        .reduce((s, t) => s + t.amount, 0);
    });
  }, [transactions]);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

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
          paddingBottom: 6,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: colors.ink,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: colors.surface, fontSize: 14, fontWeight: '600', letterSpacing: 0.4 }}>
                {initials}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: colors.muted }}>Olá,</Text>
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.ink, marginTop: 1 }}>
                {user?.name?.split(' ')[0] ?? ''}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: colors.surface,
              borderWidth: 1, borderColor: colors.hairline,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.Search size={18} color={colors.ink} />
            </Pressable>
            <Pressable style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: colors.surface,
              borderWidth: 1, borderColor: colors.hairline,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon.Bell size={18} color={colors.ink} />
              <View style={{
                position: 'absolute', top: 8, right: 9,
                width: 7, height: 7, borderRadius: 4,
                backgroundColor: colors.neg,
                borderWidth: 1.5, borderColor: colors.bg,
              }} />
            </Pressable>
          </View>
        </View>

        {/* Hero card de saldo */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View style={{
            backgroundColor: colors.ink,
            borderRadius: 22,
            padding: 20,
            overflow: 'hidden',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon.Calendar size={13} color="rgba(251,250,246,0.7)" />
                <Text style={{ fontSize: 12, color: 'rgba(251,250,246,0.7)' }}>{currentMonth}</Text>
                <Icon.ChevR size={11} color="rgba(251,250,246,0.7)" sw={1.5} />
              </View>
              <Pressable
                onPress={() => setShowBalance(!showBalance)}
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: 6, borderRadius: 999 }}
              >
                {showBalance
                  ? <Icon.Eye size={14} color="#fff" />
                  : <Icon.EyeOff size={14} color="#fff" />
                }
              </Pressable>
            </View>

            <Text style={{
              fontSize: 12, color: 'rgba(251,250,246,0.6)',
              marginTop: 14, fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase',
            }}>
              Saldo do mês
            </Text>

            {isLoading ? (
              <View style={{ marginTop: 8, gap: 8 }}>
                <SkeletonBlock w={160} h={40} radius={10} />
              </View>
            ) : isError ? (
              <Pressable onPress={() => refetch()} style={{ marginTop: 12 }}>
                <Text style={{ color: colors.neg, fontSize: 13 }}>Erro ao carregar. Toque para tentar novamente.</Text>
              </Pressable>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <Text style={{ fontSize: 18, color: 'rgba(251,250,246,0.6)' }}>R$</Text>
                <Text style={{ fontSize: 40, fontWeight: '500', color: '#FBFAF6', letterSpacing: -1.6, lineHeight: 48 }}>
                  {showBalance ? fmtBRLShort(balance) : '•••••'}
                </Text>
              </View>
            )}

            {/* Sparkbars */}
            <View style={{ marginTop: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: 'rgba(251,250,246,0.6)' }}>Despesas — últimos 14 dias</Text>
                <Text style={{ fontSize: 11, color: 'rgba(251,250,246,0.6)' }}>R$ {fmtBRLShort(expense)}</Text>
              </View>
              <Sparkbars data={sparkData} barColor="#FBFAF6" height={32} />
            </View>

            {/* Receita / Despesa split */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 12, padding: 12,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: colors.accent,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon.ArrowDn size={9} color="#0A0A0A" sw={2.5} />
                  </View>
                  <Text style={{ fontSize: 11, color: 'rgba(251,250,246,0.7)' }}>Receitas</Text>
                </View>
                {isLoading
                  ? <SkeletonBlock w={80} h={20} radius={6} />
                  : <Text style={{ fontSize: 16, fontWeight: '500', color: '#FBFAF6', marginTop: 4 }}>
                      {showBalance ? `R$ ${fmtBRLShort(income)}` : '•••••'}
                    </Text>
                }
              </View>
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 12, padding: 12,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{
                    width: 14, height: 14, borderRadius: 7,
                    backgroundColor: colors.neg,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon.ArrowUp size={9} color="#fff" sw={2.5} />
                  </View>
                  <Text style={{ fontSize: 11, color: 'rgba(251,250,246,0.7)' }}>Despesas</Text>
                </View>
                {isLoading
                  ? <SkeletonBlock w={80} h={20} radius={6} />
                  : <Text style={{ fontSize: 16, fontWeight: '500', color: '#FBFAF6', marginTop: 4 }}>
                      {showBalance ? `R$ ${fmtBRLShort(expense)}` : '•••••'}
                    </Text>
                }
              </View>
            </View>
          </View>
        </View>

        {/* Últimas transações */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 22, paddingTop: 24, paddingBottom: 6,
        }}>
          <Text style={{ fontSize: 17, fontWeight: '500', color: colors.ink, letterSpacing: -0.4 }}>
            Últimas transações
          </Text>
          <Pressable onPress={() => router.push('/transactions')}>
            <Text style={{ fontSize: 13, color: colors.ink2, fontWeight: '500', textDecorationLine: 'underline' }}>
              Ver todas
            </Text>
          </Pressable>
        </View>

        <View style={{
          marginHorizontal: 16,
          backgroundColor: colors.surface,
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingTop: 4,
          borderWidth: 1, borderColor: colors.hairline,
        }}>
          {isLoading ? (
            <View style={{ paddingVertical: 20, gap: 16 }}>
              {[1, 2, 3].map(i => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.hairline }} />
                  <View style={{ gap: 6, flex: 1 }}>
                    <View style={{ height: 14, borderRadius: 6, backgroundColor: colors.hairline, width: '60%' }} />
                    <View style={{ height: 11, borderRadius: 6, backgroundColor: colors.hairline, width: '40%' }} />
                  </View>
                </View>
              ))}
            </View>
          ) : recent.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.muted }}>Nenhuma transação este mês</Text>
            </View>
          ) : (
            recent.map((tx, i) => (
              <TxRow key={tx.id} tx={tx} last={i === recent.length - 1} />
            ))
          )}
        </View>

        {/* Cartões de crédito */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 22, paddingTop: 24, paddingBottom: 6,
        }}>
          <Text style={{ fontSize: 17, fontWeight: '500', color: colors.ink, letterSpacing: -0.4 }}>
            Cartões de crédito
          </Text>
          <Pressable onPress={() => router.push('/cards')}>
            <Text style={{ fontSize: 13, color: colors.ink2, fontWeight: '500', textDecorationLine: 'underline' }}>
              Ver todos
            </Text>
          </Pressable>
        </View>

        {cardsLoading ? (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={{ width: 220, height: 130, borderRadius: 18, backgroundColor: colors.hairline }} />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 4, paddingVertical: 4 }}
            snapToInterval={232}
            decelerationRate="fast"
          >
            {creditCards.map(card => (
              <MiniCardSummary key={card.id} card={card} onTap={() => router.push('/cards')} />
            ))}
          </ScrollView>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
