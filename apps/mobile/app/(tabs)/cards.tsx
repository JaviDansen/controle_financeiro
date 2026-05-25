import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '../../src/components/ui/Icon';
import { colors } from '../../src/theme/colors';
import { fmtBRLShort } from '../../src/lib/currency';
import { useCards } from '../../hooks/useCards';

export default function CardsScreen() {
  const router = useRouter();
  const { data: cards = [], isLoading } = useCards();
  const [activeIdx, setActiveIdx] = useState(0);

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}
        edges={['top']}
      >
        <ActivityIndicator size="large" color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 22,
            paddingTop: 8,
            paddingBottom: 4,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '500', color: colors.ink, letterSpacing: -0.8 }}>
            Cartoes
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/add')}
            style={{
              height: 38,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: colors.ink,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon.Plus size={16} color="#FBFAF6" sw={2.2} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#FBFAF6' }}>Novo</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center', paddingHorizontal: 40 }}>
            Voce ainda nao tem cartoes cadastrados.{'\n'}Toque em Novo para adicionar.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeCard = cards[activeIdx] ?? cards[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 22,
            paddingTop: 8,
            paddingBottom: 4,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '500', color: colors.ink, letterSpacing: -0.8 }}>
            Cartoes
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/add')}
            style={{
              height: 38,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: colors.ink,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon.Plus size={16} color="#FBFAF6" sw={2.2} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#FBFAF6' }}>Novo</Text>
          </Pressable>
        </View>

        <Text style={{ paddingHorizontal: 22, paddingBottom: 18, fontSize: 13, color: colors.muted }}>
          {cards.length} {cards.length === 1 ? 'cartao' : 'cartoes'} · {cards.filter((c) => c.type === 'credit').length} de credito
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
        >
          {cards.map((card, index) => {
            const active = index === activeIdx;
            return (
              <Pressable
                key={card.id}
                onPress={() => setActiveIdx(index)}
                style={{
                  width: 280,
                  minHeight: 180,
                  marginRight: 12,
                  padding: 20,
                  borderRadius: 24,
                  backgroundColor: card.gradientColors[0],
                  borderWidth: active ? 2 : 0,
                  borderColor: active ? colors.ink : 'transparent',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                      {card.bank ?? ''}
                    </Text>
                    <Text style={{ fontSize: 20, color: '#fff', fontWeight: '600', marginTop: 4 }}>
                      {card.name}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                    {card.type === 'credit' ? 'Credito' : 'Debito'}
                  </Text>
                </View>

                <View>
                  <Text style={{ fontSize: 18, color: '#fff', letterSpacing: 3 }}>
                    •••• •••• •••• {card.last4 ?? '----'}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{card.holder ?? 'Sem titular'}</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{card.expiry ?? '--/--'}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 22,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.hairline,
              gap: 14,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>
              {activeCard.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Fatura atual</Text>
                <Text style={{ fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4 }}>
                  R$ {fmtBRLShort(activeCard.currentMonthTotal)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Limite</Text>
                <Text style={{ fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4 }}>
                  {activeCard.limit !== null ? `R$ ${fmtBRLShort(activeCard.limit)}` : 'Nao informado'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Fechamento</Text>
                <Text style={{ fontSize: 16, fontWeight: '500', color: colors.ink, marginTop: 4 }}>
                  {activeCard.closingDay ?? '--'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Vencimento</Text>
                <Text style={{ fontSize: 16, fontWeight: '500', color: colors.ink, marginTop: 4 }}>
                  {activeCard.dueDay ?? '--'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Melhor dia</Text>
                <Text style={{ fontSize: 16, fontWeight: '500', color: colors.ink, marginTop: 4 }}>
                  {activeCard.bestPurchaseDay ?? '--'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
