import React from 'react'
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { Icon } from '../ui/Icon'
import { fmtBRLShort } from '../../lib/currency'
import { colors } from '../../theme/colors'
import { BlockedTransaction, Card } from '../../../services/cards.service'

const PAYMENT_OPTIONS: { id: string | null; label: string }[] = [
  { id: null, label: 'Sem vínculo' },
  { id: 'pix', label: 'Pix' },
  { id: 'transfer', label: 'Transferência' },
  { id: 'boleto', label: 'Boleto' },
]

interface CardReassignModalProps {
  blockedTxs: BlockedTransaction[]
  otherCards: Card[]
  reassignTargets: Record<string, string | null>
  onTargetChange: (txId: string, target: string | null) => void
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}

export function CardReassignModal({
  blockedTxs,
  otherCards,
  reassignTargets,
  onTargetChange,
  onConfirm,
  onCancel,
  isPending,
}: CardReassignModalProps) {
  return (
    <Modal
      visible={blockedTxs.length > 0}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(21,21,26,0.45)' }}>
        <View style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingBottom: 36, paddingTop: 20, maxHeight: '85%',
        }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: 'center', marginBottom: 20 }} />

          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#F7E8E0', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.Trash size={16} color="#A43E2C" sw={1.8} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>Cartão com transações</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 19 }}>
              Para excluir este cartão, remaneie as {blockedTxs.length} transação(ões) abaixo para outro método de pagamento.
            </Text>
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
            {blockedTxs.map(tx => {
              const target = reassignTargets[tx.id]
              return (
                <View key={tx.id} style={{
                  borderRadius: 16, borderWidth: 1, borderColor: colors.hairline,
                  backgroundColor: colors.bg, marginBottom: 10, overflow: 'hidden',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>{tx.title}</Text>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{tx.date}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: tx.type === 'income' ? colors.pos : colors.neg, marginLeft: 12 }}>
                      {tx.type === 'income' ? '+' : '−'} R$ {fmtBRLShort(tx.amount)}
                    </Text>
                  </View>

                  <View style={{ borderTopWidth: 1, borderTopColor: colors.hairline, padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {PAYMENT_OPTIONS.map(opt => {
                      const active = target === opt.id
                      return (
                        <Pressable
                          key={String(opt.id)}
                          onPress={() => onTargetChange(tx.id, opt.id)}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                            borderWidth: 1.5,
                            borderColor: active ? colors.ink : colors.hairline,
                            backgroundColor: active ? colors.ink : 'transparent',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '500', color: active ? '#FBFAF6' : colors.muted }}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      )
                    })}
                    {otherCards.map(card => {
                      const active = target === card.id
                      return (
                        <Pressable
                          key={card.id}
                          onPress={() => onTargetChange(tx.id, card.id)}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                            borderWidth: 1.5,
                            borderColor: active ? colors.ink : colors.hairline,
                            backgroundColor: active ? colors.ink : 'transparent',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '500', color: active ? '#FBFAF6' : colors.muted }}>
                            {card.name}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              )
            })}
            <View style={{ height: 8 }} />
          </ScrollView>

          <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
            <Pressable
              onPress={onConfirm}
              disabled={isPending}
              style={{
                borderRadius: 18, paddingVertical: 16,
                backgroundColor: colors.ink,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending
                ? <ActivityIndicator size="small" color="#FBFAF6" />
                : <Icon.Check size={16} color="#FBFAF6" sw={2.5} />
              }
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#FBFAF6' }}>
                {isPending ? 'Remanejando...' : 'Remanejar e excluir cartão'}
              </Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              disabled={isPending}
              style={{
                borderRadius: 18, paddingVertical: 14,
                borderWidth: 1.5, borderColor: colors.hairline,
                alignItems: 'center', opacity: isPending ? 0.4 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.muted }}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
