import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Icon } from '../src/components/ui/Icon';
import { TxRow } from '../src/components/transactions/TxRow';
import { TRANSACTIONS } from '../src/data/mocks/transactions';
import { fmtBRLShort } from '../src/lib/currency';
import { colors } from '../src/theme/colors';
import { Card } from '../src/types/finance';
import { useCards } from '../hooks/useCards';

const CARD_WIDTH = 296;
const CARD_GAP = 12;
const CARD_SNAP = CARD_WIDTH + CARD_GAP;

/* ─── Face do cartão ─────────────────────────────────────── */
function BigCard({ card, active }: { card: Card; active: boolean }) {
  return (
    <View style={{
      width: CARD_WIDTH,
      aspectRatio: 1.586,
      backgroundColor: card.gradientColors[0],
      borderRadius: 22,
      padding: 20,
      justifyContent: 'space-between',
      overflow: 'hidden',
      transform: [{ scale: active ? 1 : 0.94 }],
      opacity: active ? 1 : 0.7,
      marginRight: CARD_GAP,
      shadowColor: '#15151A',
      shadowOpacity: active ? 0.22 : 0.10,
      shadowRadius: active ? 20 : 7,
      shadowOffset: { width: 0, height: active ? 12 : 4 },
      elevation: active ? 10 : 4,
    }}>
      {/* glow */}
      <View style={{
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: card.accent ?? '#ffffff', opacity: 0.22,
      }} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            {card.bank ?? ''}
          </Text>
          <Text style={{ fontSize: 18, color: '#fff', fontWeight: '500', marginTop: 2 }}>
            {card.name}
          </Text>
        </View>
        <View style={{
          paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.18)',
        }}>
          <Text style={{ fontSize: 10, color: '#fff', fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            {card.type === 'credit' ? 'Crédito' : 'Débito'}
          </Text>
        </View>
      </View>

      {/* chip simulado */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{
          width: 32, height: 24, borderRadius: 5,
          backgroundColor: 'rgba(255,255,255,0.35)',
          borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.15)',
        }} />
        <Icon.More size={18} color="rgba(255,255,255,0.6)" />
      </View>

      <View>
        <Text style={{ fontSize: 17, color: 'rgba(255,255,255,0.95)', letterSpacing: 3 }}>
          •••• •••• •••• {card.last4 ?? '----'}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <View>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Titular</Text>
            <Text style={{ fontSize: 11, color: '#fff', fontWeight: '500', letterSpacing: 0.8 }}>{card.holder ?? ''}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Validade</Text>
            <Text style={{ fontSize: 11, color: '#fff', fontWeight: '500' }}>{card.expiry ?? '--/--'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ─── Anel de utilização ─────────────────────────────────── */
function UtilizationRing({ pct }: { pct: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct);
  return (
    <View style={{ width: 72, height: 72, position: 'relative' }}>
      <Svg width={72} height={72} viewBox="0 0 72 72">
        <SvgCircle cx="36" cy="36" r={r} fill="none" stroke={colors.hairline} strokeWidth="6" />
        <SvgCircle
          cx="36" cy="36" r={r} fill="none"
          stroke={colors.ink} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          rotation="-90"
          origin="36, 36"
        />
      </Svg>
      <View style={{
        position: 'absolute', inset: 0,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>
          {Math.round(pct * 100)}%
        </Text>
      </View>
    </View>
  );
}

/* ─── Stat ───────────────────────────────────────────────── */
function Stat({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase', fontWeight: '500', letterSpacing: 0.4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 18, fontWeight: '500', color: colors.ink, marginTop: 4, letterSpacing: -0.4 }}>
        {value}
      </Text>
      {sublabel && (
        <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{sublabel}</Text>
      )}
    </View>
  );
}

/* ─── Cards Screen ───────────────────────────────────────── */
export default function CardsScreen() {
  const [activeIdx, setActiveIdx] = useState(0);
  const { data: cards = [], isLoading } = useCards();

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_SNAP);
    setActiveIdx(Math.max(0, Math.min(cards.length - 1, idx)));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: '500', color: colors.ink, letterSpacing: -0.8 }}>Cartões</Text>
          <Pressable
            onPress={() => Alert.alert('Em breve', 'Adicionar cartão em breve.')}
            style={{ height: 38, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon.Plus size={16} color="#FBFAF6" sw={2.2} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#FBFAF6' }}>Novo</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center', paddingHorizontal: 40 }}>
            Você ainda não tem cartões cadastrados.{'\n'}Toque em Novo para adicionar.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const active = cards[activeIdx] ?? cards[0];
  const cardTxs = TRANSACTIONS.filter(t => t.card === active.id);
  const usage = active.limit ? active.used / active.limit : 0;

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
          paddingBottom: 4,
        }}>
          <Text style={{ fontSize: 28, fontWeight: '500', color: colors.ink, letterSpacing: -0.8 }}>
            Cartões
          </Text>
          <Pressable
            onPress={() => Alert.alert('Em breve', 'Modal de criação de cartão em breve.')}
            style={{
              height: 38,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: colors.ink,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}>
            <Icon.Plus size={16} color="#FBFAF6" sw={2.2} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#FBFAF6' }}>Novo</Text>
          </Pressable>
        </View>

        <Text style={{ paddingHorizontal: 22, paddingBottom: 18, fontSize: 13, color: colors.muted }}>
          {cards.length} {cards.length === 1 ? 'cartão' : 'cartões'} · {cards.filter(c => c.type === 'credit').length} de crédito
        </Text>

        {/* Carrossel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          snapToInterval={CARD_SNAP}
          decelerationRate="fast"
          contentContainerStyle={{ paddingLeft: 28, paddingRight: 16, paddingBottom: 8 }}
        >
          {cards.map((card, i) => (
            <BigCard key={card.id} card={card} active={i === activeIdx} />
          ))}
        </ScrollView>

        {/* Dots paginadores */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 14 }}>
          {cards.map((_, i) => (
            <View key={i} style={{
              width: i === activeIdx ? 18 : 6,
              height: 6,
              borderRadius: 4,
              backgroundColor: i === activeIdx ? colors.ink : colors.hairline,
            }} />
          ))}
        </View>

        {/* Painel de detalhes */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 22,
            padding: 18,
            borderWidth: 1, borderColor: colors.hairline,
            gap: 16,
          }}>
            {active.type === 'credit' ? (
              <>
                {/* Anel de utilização */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <UtilizationRing pct={usage} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: colors.muted, textTransform: 'uppercase', fontWeight: '500', letterSpacing: 0.4 }}>
                      Limite usado
                    </Text>
                    <Text style={{ fontSize: 22, fontWeight: '500', color: colors.ink, marginTop: 4, letterSpacing: -0.4 }}>
                      R$ {fmtBRLShort(active.used)}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      de R$ {fmtBRLShort(active.limit ?? 0)}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: colors.hairline }} />

                {/* Fatura + parcelas */}
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Stat
                    label="Fatura atual"
                    value={`R$ ${fmtBRLShort(active.currentMonthTotal)}`}
                    sublabel={active.dueDay ? `Vence dia ${active.dueDay}` : undefined}
                  />
                  <View style={{ width: 1, backgroundColor: colors.hairline }} />
                  <Stat
                    label="Parcelas abertas"
                    value={`${active.openInstallmentsCount}`}
                    sublabel={`R$ ${fmtBRLShort(active.openInstallmentsTotal)} restantes`}
                  />
                </View>

                {active.bestPurchaseDay && (
                  <>
                    <View style={{ height: 1, backgroundColor: colors.hairline }} />
                    {/* Melhor dia de compra */}
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: colors.accentSoft,
                      borderRadius: 14,
                      padding: 14,
                    }}>
                      <View style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: colors.accent,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#FBFAF6' }}>
                          {active.bestPurchaseDay}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.accentInk }}>
                          Melhor dia de compra
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.accentInk, opacity: 0.75, marginTop: 1 }}>
                          Fecha dia {active.closingDay} · próximo útil + 1
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </>
            ) : (
              <View style={{ paddingVertical: 8 }}>
                <Text style={{ fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '500' }}>
                  Cartão de débito
                </Text>
                <Text style={{ fontSize: 14, color: colors.ink2, marginTop: 8, lineHeight: 22 }}>
                  Usado para categorizar transações pagas no débito. Sem fatura, limite ou parcelamentos.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Transações deste cartão */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 22,
          paddingTop: 24,
          paddingBottom: 6,
        }}>
          <Text style={{ fontSize: 17, fontWeight: '500', color: colors.ink, letterSpacing: -0.4 }}>
            Transações neste cartão
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>{cardTxs.length}</Text>
        </View>

        <View style={{
          marginHorizontal: 16,
          backgroundColor: colors.surface,
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingTop: 4,
          borderWidth: 1, borderColor: colors.hairline,
        }}>
          {cardTxs.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: colors.muted }}>
                Nenhuma transação neste cartão ainda.
              </Text>
            </View>
          ) : cardTxs.map((tx, i) => (
            <TxRow key={tx.id} tx={tx} last={i === cardTxs.length - 1} />
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
