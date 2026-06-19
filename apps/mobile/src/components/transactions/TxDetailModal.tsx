import React from 'react'
import { Modal, View, Text, Pressable } from 'react-native'
import { Icon } from '../ui/Icon'
import { fmtBRLShort } from '../../lib/currency'
import { colors } from '../../theme/colors'
import { getCategoryIcon } from '../../lib/categoryIcons'
import { Transaction } from '../../../services/transactions.service'
import { TxDetailRow } from './TxDetailRow'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmada', color: '#1E5229', bg: '#DDF0E4' },
  pending:   { label: 'Pendente',   color: '#5A4A10', bg: '#F5F0DC' },
  cancelled: { label: 'Cancelada',  color: '#7A2F10', bg: '#F7E8E0' },
}

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split('-')
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`
}

interface TxDetailModalProps {
  tx: Transaction | null
  onClose: () => void
  onEdit: (tx: Transaction) => void
}

export function TxDetailModal({ tx, onClose, onEdit }: TxDetailModalProps) {
  const catIcon = tx ? getCategoryIcon(tx.categoryIcon) : null
  const statusInfo = tx ? (STATUS_LABELS[tx.status] ?? STATUS_LABELS.confirmed) : null

  return (
    <Modal
      visible={!!tx}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(21,21,26,0.5)', justifyContent: 'center', paddingHorizontal: 20 }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, overflow: 'hidden' }}>
            {tx && catIcon && statusInfo && (() => {
              const isPos = tx.type === 'income'
              const CatIcon = catIcon
              return (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: tx.categoryColor, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                      <CatIcon size={18} color="#fff" strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>{tx.title}</Text>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{tx.categoryName}</Text>
                    </View>
                    <Pressable
                      onPress={onClose}
                      style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.hairline, alignItems: 'center', justifyContent: 'center', marginLeft: 8, flexShrink: 0 }}
                    >
                      <Text style={{ fontSize: 16, color: colors.muted, lineHeight: 20 }}>×</Text>
                    </Pressable>
                  </View>

                  <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.bg, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '500' }}>
                        {isPos ? 'Receita' : 'Despesa'}
                      </Text>
                      <Text style={{ fontSize: 26, fontWeight: '500', color: isPos ? colors.pos : colors.ink, letterSpacing: -0.8, marginTop: 2 }}>
                        {isPos ? '+' : '−'} R${fmtBRLShort(tx.amount)}
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: statusInfo.bg, borderRadius: 999 }}>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: statusInfo.color }}>{statusInfo.label}</Text>
                    </View>
                  </View>

                  <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
                    <TxDetailRow label="Data" value={formatDateBR(tx.date)} />
                    <TxDetailRow label="Categoria" value={tx.categoryName} />
                    <TxDetailRow label="Pagamento" value={tx.cardId ? 'Cartão vinculado' : 'Sem vínculo'} />
                    <TxDetailRow label="Recorrente" value={tx.isRecurring ? 'Sim' : 'Não'} />
                    {tx.notes && <TxDetailRow label="Notas" value={tx.notes} />}
                  </View>

                  <View style={{ paddingHorizontal: 20, paddingBottom: 20, borderTopWidth: 1, borderTopColor: colors.hairline }}>
                    <Pressable onPress={() => onEdit(tx)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
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
                  </View>
                </>
              )
            })()}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
