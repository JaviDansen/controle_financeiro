import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Icon } from '../ui/Icon'
import { fmtBRLShort } from '../../lib/currency'
import { colors } from '../../theme/colors'
import { Card, CreditCard, DebitCard } from '../../../services/cards.service'
import { formatShortDate } from '../../lib/date'

interface CardDetailPanelProps {
  card: Card
  monthIncome: number
  onMorePress: () => void
}

function CreditDetails({ card }: { card: CreditCard }) {
  return (
    <>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Fatura atual</Text>
          <Text style={{ fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4 }}>
            R$ {fmtBRLShort(card.currentMonthTotal)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Limite</Text>
          <Text style={{ fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4 }}>
            {card.limit !== null ? `R$ ${fmtBRLShort(card.limit)}` : 'Não informado'}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Compre após</Text>
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.ink, marginTop: 4 }}>
            {card.bestPurchaseDate ? formatShortDate(card.bestPurchaseDate) : '--'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Fechamento</Text>
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.ink, marginTop: 4 }}>
            {card.closingDay ?? '--'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Vencimento</Text>
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.ink, marginTop: 4 }}>
            {card.dueDay ?? '--'}
          </Text>
        </View>
      </View>
    </>
  )
}

function DebitDetails({ card, monthIncome }: { card: DebitCard; monthIncome: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Gasto no mês</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4 }}>
          R$ {fmtBRLShort(card.monthlySpent)}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Saldo</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 20, fontWeight: '600', color: colors.pos, marginTop: 4 }}>
          R$ {fmtBRLShort(monthIncome)}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Disponível</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4 }}>
          R$ {fmtBRLShort(Math.max(0, monthIncome - card.monthlySpent))}
        </Text>
      </View>
    </View>
  )
}

export function CardDetailPanel({ card, monthIncome, onMorePress }: CardDetailPanelProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
      <View style={{
        backgroundColor: colors.surface, borderRadius: 22, padding: 18,
        borderWidth: 1, borderColor: colors.hairline, gap: 14,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: '600', color: colors.ink }}>{card.name}</Text>
          <Pressable
            onPress={onMorePress}
            style={{
              width: 36, height: 36, borderRadius: 999,
              backgroundColor: 'rgba(21,21,26,0.035)',
              borderWidth: 1, borderColor: 'rgba(21,21,26,0.08)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon.More size={18} color={colors.ink} />
          </Pressable>
        </View>
        {card.type === 'credit'
          ? <CreditDetails card={card} />
          : <DebitDetails card={card} monthIncome={monthIncome} />
        }
      </View>
    </View>
  )
}
