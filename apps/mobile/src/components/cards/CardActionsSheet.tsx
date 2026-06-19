import React from 'react'
import { Modal, View, Text, Pressable } from 'react-native'
import { Icon } from '../ui/Icon'
import { colors } from '../../theme/colors'

interface CardActionsSheetProps {
  visible: boolean
  onClose: () => void
  onEdit: () => void
  onRemove: () => void
  isDeleting: boolean
}

export function CardActionsSheet({ visible, onClose, onEdit, onRemove, isDeleting }: CardActionsSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(21,21,26,0.28)' }}
        />
        <View style={{
          margin: 12, marginBottom: 24, borderRadius: 28,
          backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
          padding: 8, gap: 4,
        }}>
          <View style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: colors.hairline, alignSelf: 'center', marginVertical: 8 }} />

          <Pressable
            onPress={onEdit}
            style={{ height: 52, borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12 }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(21,21,26,0.045)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.Edit size={15} color={colors.ink} sw={1.7} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: colors.ink }}>Editar cartão</Text>
          </Pressable>

          <Pressable
            onPress={onRemove}
            disabled={isDeleting}
            style={{ height: 52, borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12, opacity: isDeleting ? 0.65 : 1 }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(164,62,44,0.075)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.Trash size={15} color="#A43E2C" sw={1.7} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: '#A43E2C' }}>
              {isDeleting ? 'Removendo...' : 'Remover cartão'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
