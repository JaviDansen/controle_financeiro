import React from 'react'
import { Modal, View, Text, Pressable } from 'react-native'
import { Icon } from '../ui/Icon'
import { fmtBRLShort } from '../../lib/currency'
import { colors } from '../../theme/colors'
import { getCategoryIcon } from '../../lib/categoryIcons'
import { Transaction } from '../../../services/transactions.service'

interface TxActionSheetProps {
  tx: Transaction | null
  onClose: () => void
  onEdit: (tx: Transaction) => void
}

export function TxActionSheet({ tx, onClose, onEdit }: TxActionSheetProps) {
  const icon = tx ? getCategoryIcon(tx.categoryIcon) : null

  return (
    <Modal
      visible={!!tx}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(21,21,26,0.4)' }}
          onPress={onClose}
        />
        <View style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingBottom: 36, paddingTop: 12,
          paddingHorizontal: 16,
        }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: 'center', marginBottom: 16 }} />

          {tx && icon && (() => {
            const AIcon = icon
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.hairline, borderRadius: 14, padding: 12, marginBottom: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: tx.categoryColor, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                  <AIcon size={15} color="#fff" strokeWidth={2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>{tx.title}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>{tx.categoryName} · {tx.date}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', flexShrink: 0, marginLeft: 8, color: tx.type === 'income' ? colors.pos : colors.ink, letterSpacing: -0.2 }}>
                  {tx.type === 'income' ? '+' : '−'} R${fmtBRLShort(tx.amount)}
                </Text>
              </View>
            )
          })()}

          <View style={{ height: 1, backgroundColor: colors.hairline, marginBottom: 4 }} />

          <Pressable onPress={() => tx && onEdit(tx)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
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

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 }}>
            <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: colors.hairline, alignItems: 'center', justifyContent: 'center' }}>
              <Icon.ChevR size={15} color={colors.muted} sw={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.muted }}>Para excluir</Text>
              <Text style={{ fontSize: 12, color: colors.muted, opacity: 0.7, marginTop: 1 }}>Deslize o card para a esquerda</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}
