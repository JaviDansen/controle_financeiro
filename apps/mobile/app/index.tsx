import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '../src/components/ui/Icon';
import { TxRow } from '../src/components/transactions/TxRow';
import { TRANSACTIONS } from '../src/data/mocks/transactions';
import { CARDS } from '../src/data/mocks/cards';
import { SUMMARY } from '../src/data/mocks/summary';
import { USER } from '../src/data/mocks/user';
import { fmtBRLShort } from '../src/lib/currency';
import { colors } from '../src/theme/colors';
import { Card } from '../src/types/finance';

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
      {/* glow */}
      <View style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: card.accent,
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
          R$ {fmtBRLShort(card.current_month_total)}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{card.open_installments_count} parcelas</Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Fecha dia {card.closing_day}</Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ─── Dashboard ──────────────────────────────────────────── */
export default function HomeScreen() {
  const router = useRouter();
  const [showBalance, setShowBalance] = useState(true);

  const recent = TRANSACTIONS.slice(0, 5);
  const creditCards = CARDS.filter(c => c.type === 'credit');
  const balance = SUMMARY.income - SUMMARY.expense;

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
                {USER.initials}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: colors.muted }}>Olá,</Text>
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.ink, marginTop: 1 }}>
                {USER.name.split(' ')[0]}
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
                <Text style={{ fontSize: 12, color: 'rgba(251,250,246,0.7)' }}>{SUMMARY.month}</Text>
                <Icon.ChevR size={11} color="rgba(251,250,246,0.7)" sw={1.5} />
              </View>
              <Pressable
                onPress={() => setShowBalance(!showBalance)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  padding: 6, borderRadius: 999,
                }}
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

            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <Text style={{ fontSize: 18, color: 'rgba(251,250,246,0.6)' }}>R$</Text>
              <Text style={{ fontSize: 40, fontWeight: '500', color: '#FBFAF6', letterSpacing: -1.6, lineHeight: 48 }}>
                {showBalance ? fmtBRLShort(balance) : '•••••'}
              </Text>
            </View>

            {/* Sparkbars */}
            <View style={{ marginTop: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, color: 'rgba(251,250,246,0.6)' }}>Despesas — últimos 14 dias</Text>
                <Text style={{ fontSize: 11, color: 'rgba(251,250,246,0.6)' }}>R$ {fmtBRLShort(SUMMARY.expense)}</Text>
              </View>
              <Sparkbars data={SUMMARY.daily} barColor="#FBFAF6" height={32} />
            </View>

            {/* Receita / Despesa split */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 12,
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
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#FBFAF6', marginTop: 4 }}>
                  {showBalance ? `R$ ${fmtBRLShort(SUMMARY.income)}` : '•••••'}
                </Text>
              </View>
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 12,
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
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#FBFAF6', marginTop: 4 }}>
                  {showBalance ? `R$ ${fmtBRLShort(SUMMARY.expense)}` : '•••••'}
                </Text>
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
          {recent.map((tx, i) => (
            <TxRow key={tx.id} tx={tx} last={i === recent.length - 1} />
          ))}
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

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
