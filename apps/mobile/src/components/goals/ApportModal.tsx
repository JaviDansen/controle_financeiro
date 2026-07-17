import React, { useState, useEffect } from 'react'
import { Modal, View, Text, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { Goal } from '../../types/finance'
import { colors } from '../../theme/colors'
import { fmtBRLShort } from '../../lib/currency'
import { Icon } from '../ui/Icon'

interface ApportModalProps {
  visible: boolean
  goal: Goal | null
  onClose: () => void
  onConfirm: (amount: number) => Promise<void>
  isPending: boolean
}

export function ApportModal({ visible, goal, onClose, onConfirm, isPending }: ApportModalProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setValue('')
      setError(null)
    }
  }, [visible])

  if (!goal) return null

  const remaining = goal.target - goal.current

  async function handleConfirm() {
    if (!goal) return
    setError(null)
    // Substitui vírgula por ponto para parsing correto
    const parsedAmount = parseFloat(value.replace(',', '.'))
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor, insira um valor válido e maior que zero.')
      return
    }

    if (goal.current + parsedAmount > goal.target) {
      setError(`O aporte não pode exceder o valor restante de R$ ${fmtBRLShort(remaining)}.`)
      return
    }

    try {
      await onConfirm(parsedAmount)
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao realizar o aporte.')
    }
  }

  if (!visible) return null

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(21,21,26,0.45)',
        justifyContent: 'flex-end',
        zIndex: 1000,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end' }}
          onPress={onClose}
        >
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: Platform.OS === 'ios' ? 44 : 36,
              paddingTop: 20,
              paddingHorizontal: 22,
              width: '100%',
            }}
            onPress={(e) => e.stopPropagation()} // impede fechar ao clicar dentro
          >
            {/* Handle bar */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: 'center', marginBottom: 20 }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: `${goal.color}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{goal.emoji}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>Aporte rápido</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{goal.title}</Text>
                </View>
              </View>
              <Pressable onPress={onClose} hitSlop={8}>
                <Icon.X size={16} color={colors.muted} />
              </Pressable>
            </View>

            {/* Target Status info */}
            <View
              style={{
                backgroundColor: 'rgba(21,21,26,0.04)',
                borderRadius: 16,
                padding: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <View>
                <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Faltam</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink, marginTop: 2 }}>
                  R$ {fmtBRLShort(remaining)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase', textAlign: 'right' }}>Meta</Text>
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.muted, marginTop: 2, textAlign: 'right' }}>
                  R$ {fmtBRLShort(goal.target)}
                </Text>
              </View>
            </View>

            {/* Input field */}
            <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink2, marginBottom: 8 }}>Valor do aporte</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: error ? colors.neg : colors.hairline,
                borderRadius: 14,
                paddingHorizontal: 14,
                height: 50,
                backgroundColor: colors.bg,
                marginBottom: error ? 8 : 20,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '500', color: colors.muted, marginRight: 6 }}>R$</Text>
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 16,
                  fontWeight: '500',
                  color: colors.ink,
                  paddingVertical: 0,
                }}
                placeholder="0,00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                value={value}
                onChangeText={(text) => {
                  setValue(text)
                  setError(null)
                }}
                autoFocus
              />
            </View>

            {/* Error Message */}
            {error && (
              <Text style={{ fontSize: 12, color: colors.neg, fontWeight: '500', marginBottom: 20 }}>
                {error}
              </Text>
            )}

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={onClose}
                disabled={isPending}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                disabled={isPending}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: colors.pos, // Botão verde de confirmar!
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed || isPending ? 0.8 : 1,
                })}
              >
                {isPending ? (
                  <ActivityIndicator color="#FBFAF6" size="small" />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FBFAF6' }}>Confirmar</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  )
}
