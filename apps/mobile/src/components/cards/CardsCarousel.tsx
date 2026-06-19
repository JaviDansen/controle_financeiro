import React from 'react'
import { ScrollView, View, Text, Pressable } from 'react-native'
import { colors } from '../../theme/colors'
import { Card } from '../../../services/cards.service'

interface CardsCarouselProps {
  cards: Card[]
  activeIdx: number
  onCardPress: (index: number) => void
}

export function CardsCarousel({ cards, activeIdx, onCardPress }: CardsCarouselProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
    >
      {cards.map((card, index) => {
        const active = index === activeIdx
        return (
          <Pressable
            key={card.id}
            onPress={() => onCardPress(index)}
            style={{
              width: 280, minHeight: 180, marginRight: 12, padding: 20,
              borderRadius: 24, backgroundColor: card.gradientColors[0],
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
                {card.type === 'credit' ? 'Crédito' : 'Débito'}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, color: '#fff', letterSpacing: 3 }}>
                **** **** **** {card.last4 ?? '----'}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{card.holder ?? 'Sem titular'}</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{card.expiry ?? '--/--'}</Text>
              </View>
            </View>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
