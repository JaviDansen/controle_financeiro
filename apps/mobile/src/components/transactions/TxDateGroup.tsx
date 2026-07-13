import React, { useCallback } from 'react'
import { View, Text } from 'react-native'
import { fmtBRLShort } from '../../lib/currency'
import { colors } from '../../theme/colors'
import { TxListItem } from '../../../hooks/useTransactionFilter'
import { Transaction } from '../../../services/transactions.service'
import { TxRow } from './TxRow'
import { SwipeableRow } from './SwipeableRow'

interface DateHeaderProps {
  dateKey: string
  net: number
}

function DateHeaderBase({ dateKey, net }: DateHeaderProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 26, paddingTop: 16, paddingBottom: 8 }}>
      <Text style={{ fontSize: 11, color: colors.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1.2 }}>
        {dateKey}
      </Text>
      <Text style={{ fontSize: 11, color: colors.muted }}>
        {net >= 0 ? '+' : '−'} R$ {fmtBRLShort(Math.abs(net))}
      </Text>
    </View>
  )
}

export const DateHeader = React.memo(DateHeaderBase)

interface TxListRowProps {
  item: Extract<TxListItem, { kind: 'transaction-row' }>
  onPressTx: (tx: Transaction) => void
  onDeleteTx: (tx: Transaction) => void
}

// Cada linha desenha sua própria borda de grupo (topo/base arredondados)
// em vez de depender de um wrapper por grupo — necessário porque a FlatList
// virtualiza item a item, não grupo a grupo.
//
// Recebe onPressTx/onDeleteTx (referências estáveis do componente pai) em vez
// de onPress/onDelete já fechados sobre `tx` — assim o renderItem da FlatList
// não precisa criar uma closure nova por item a cada render da lista.
function TxListRowBase({ item, onPressTx, onDeleteTx }: TxListRowProps) {
  const { tx, isFirstOfGroup, isLastOfGroup } = item
  const handlePress = useCallback(() => onPressTx(tx), [onPressTx, tx])
  const handleDelete = useCallback(() => onDeleteTx(tx), [onDeleteTx, tx])

  return (
    <View
      style={{
        marginHorizontal: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.hairline,
        overflow: 'hidden',
        borderTopLeftRadius: isFirstOfGroup ? 16 : 0,
        borderTopRightRadius: isFirstOfGroup ? 16 : 0,
        borderBottomLeftRadius: isLastOfGroup ? 16 : 0,
        borderBottomRightRadius: isLastOfGroup ? 16 : 0,
        borderTopWidth: isFirstOfGroup ? 1 : 0,
        marginBottom: isLastOfGroup ? 16 : 0,
      }}
    >
      <SwipeableRow onDelete={handleDelete}>
        <View style={{ paddingHorizontal: 16, backgroundColor: colors.surface }}>
          <TxRow tx={tx} last={isLastOfGroup} onPress={handlePress} />
        </View>
      </SwipeableRow>
    </View>
  )
}

export const TxListRow = React.memo(TxListRowBase)
