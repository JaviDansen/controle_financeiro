import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { colors } from '../../theme/colors';
import { fmtBRLShort } from '../../lib/currency';
import { Card, CreditCard, DebitCard } from '../../../services/cards.service';

interface HomeCardsCarouselProps {
  cards: Card[];
  isLoading: boolean;
  onCardTap: () => void;
}

function CreditCardItem({ card, onTap }: { card: CreditCard; onTap: () => void }) {
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

function DebitCardItem({ card, onTap }: { card: DebitCard; onTap: () => void }) {
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
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Gasto no mês</Text>
        <Text style={{ fontSize: 20, fontWeight: '500', color: '#fff', letterSpacing: -0.4, marginTop: 2 }}>
          R$ {fmtBRLShort(card.monthlySpent)}
        </Text>
      </View>
    </Pressable>
  );
}

function CardSkeleton() {
  return (
    <View style={{ width: 220, height: 130, borderRadius: 18, backgroundColor: colors.hairline }} />
  );
}

export function HomeCardsCarousel({ cards, isLoading, onCardTap }: HomeCardsCarouselProps) {
  if (isLoading) {
    return (
      <View style={{ paddingHorizontal: 16 }}>
        <CardSkeleton />
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ fontSize: 14, color: colors.muted }}>Nenhum cartão cadastrado</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: 16, paddingRight: 4, paddingVertical: 4 }}
      snapToInterval={232}
      decelerationRate="fast"
    >
      {cards.map(card =>
        card.type === 'credit'
          ? <CreditCardItem key={card.id} card={card} onTap={onCardTap} />
          : <DebitCardItem key={card.id} card={card} onTap={onCardTap} />
      )}
    </ScrollView>
  );
}
