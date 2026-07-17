import React, { useState, useEffect } from 'react'
import { Modal, View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { Goal } from '../../types/finance'
import { colors } from '../../theme/colors'
import { parseDateLabelToYmd } from '../../../services/goals.service'
import { Icon } from '../ui/Icon'

interface GoalFormModalProps {
  visible: boolean
  goal: Goal | null
  onClose: () => void
  onSave: (payload: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  isPending: boolean
}

const PREDEFINED_COLORS = [
  '#C07830', // Laranja/Bronze
  '#3D8B4E', // Verde
  '#4B5EA0', // Azul
  '#2E7A8A', // Teal
  '#B85732', // Terracota
  '#8B57B8', // Roxo
  '#15151A'  // Preto
]

const PREDEFINED_EMOJIS = ['🎯', '💰', '🏡', '🚗', '✈️', '💻', '🎓', '🎁', '📈']

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function buildDeadlineDate(dayStr: string, monthStr: string, yearStr: string): { date: string | null; error: string | null } {
  const dayVal = dayStr.trim()
  const monthVal = monthStr.trim()
  const yearVal = yearStr.trim()

  if (!dayVal && !monthVal && !yearVal) {
    return { date: null, error: null }
  }

  if (!yearVal) {
    return { date: null, error: 'O ano é obrigatório para definir um prazo.' }
  }

  const year = parseInt(yearVal, 10)
  if (isNaN(year) || year < 2000 || year > 2100) {
    return { date: null, error: 'Ano inválido (deve ser entre 2000 e 2100).' }
  }

  // Caso 5: colocar dia e ano sem o mês - não permitir
  if (dayVal && !monthVal) {
    return { date: null, error: 'Não é permitido informar o dia sem o mês.' }
  }

  // Caso 1: colocar só o ano
  if (!monthVal && !dayVal) {
    return { date: `${year}-12-31`, error: null }
  }

  // Caso 2: colocar ano e mês
  const month = parseInt(monthVal, 10)
  if (isNaN(month) || month < 1 || month > 12) {
    return { date: null, error: 'Mês inválido (deve ser entre 01 e 12).' }
  }

  if (!dayVal) {
    const lastDay = getLastDayOfMonth(year, month)
    const formattedMonth = String(month).padStart(2, '0')
    const formattedDay = String(lastDay).padStart(2, '0')
    return { date: `${year}-${formattedMonth}-${formattedDay}`, error: null }
  }

  // Caso 3: colocar ano, mês e dia
  const day = parseInt(dayVal, 10)
  const lastDay = getLastDayOfMonth(year, month)
  if (isNaN(day) || day < 1 || day > lastDay) {
    return { date: null, error: `Dia inválido para o mês informado (deve ser entre 01 e ${lastDay}).` }
  }

  const formattedMonth = String(month).padStart(2, '0')
  const formattedDay = String(day).padStart(2, '0')
  return { date: `${year}-${formattedMonth}-${formattedDay}`, error: null }
}

export function GoalFormModal({ visible, goal, onClose, onSave, onDelete, isPending }: GoalFormModalProps) {
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [category, setCategory] = useState('')
  const [selectedColor, setSelectedColor] = useState(PREDEFINED_COLORS[0])
  const [selectedEmoji, setSelectedEmoji] = useState(PREDEFINED_EMOJIS[0])
  const [customEmoji, setCustomEmoji] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (visible) {
      setError(null)
      setIsDeleting(false)
      if (goal) {
        setTitle(goal.title)
        setTargetAmount(String(goal.target))
        setCurrentAmount(String(goal.current))
        setCategory('geral')
        setSelectedColor(goal.color)
        
        const ymd = parseDateLabelToYmd(goal.deadline)
        if (ymd) {
          const [y, m, d] = ymd.split('-')
          setYear(y)
          setMonth(m)
          setDay(d)
        } else {
          setYear('')
          setMonth('')
          setDay('')
        }

        if (PREDEFINED_EMOJIS.includes(goal.emoji)) {
          setSelectedEmoji(goal.emoji)
          setCustomEmoji('')
        } else {
          setSelectedEmoji('')
          setCustomEmoji(goal.emoji)
        }
      } else {
        setTitle('')
        setTargetAmount('')
        setCurrentAmount('0')
        setDay('')
        setMonth('')
        setYear('')
        setCategory('')
        setSelectedColor(PREDEFINED_COLORS[0])
        setSelectedEmoji(PREDEFINED_EMOJIS[0])
        setCustomEmoji('')
      }
    }
  }, [visible, goal])

  const isEditing = !!goal

  async function handleSave() {
    setError(null)
    const target = parseFloat(targetAmount.replace(',', '.'))
    const current = parseFloat(currentAmount.replace(',', '.'))

    if (!title.trim()) {
      setError('O título é obrigatório.')
      return
    }

    if (isNaN(target) || target <= 0) {
      setError('O valor alvo deve ser maior que zero.')
      return
    }

    if (isNaN(current) || current < 0) {
      setError('O valor guardado não pode ser negativo.')
      return
    }

    if (current > target) {
      setError('O valor guardado não pode exceder o valor alvo.')
      return
    }

    // Valida e constrói a data do prazo
    const { date: deadlineDate, error: dateError } = buildDeadlineDate(day, month, year)
    if (dateError) {
      setError(dateError)
      return
    }

    const payload = {
      title: title.trim(),
      targetAmount: target,
      currentAmount: current,
      deadline: deadlineDate,
      category: category.trim() || 'geral',
      color: selectedColor,
      emoji: customEmoji.trim() || selectedEmoji,
      isActive: goal ? goal.active : true,
    }

    try {
      await onSave(payload)
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar a meta.')
    }
  }

  async function handleDelete() {
    if (!goal || !onDelete) return
    setError(null)
    setIsDeleting(true)
    try {
      await onDelete(goal.id)
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao excluir a meta.')
    } finally {
      setIsDeleting(false)
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
              paddingTop: 20,
              height: '82%',
              width: '100%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: 'center', marginBottom: 20 }} />

            <View style={{ paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>
                {isEditing ? 'Editar meta' : 'Nova meta'}
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Icon.X size={16} color={colors.muted} />
              </Pressable>
            </View>

            {/* Scrollable Form Content */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              
              {/* Title Input */}
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink2, marginBottom: 8 }}>Título</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  height: 48,
                  backgroundColor: colors.bg,
                  fontSize: 15,
                  color: colors.ink,
                  marginBottom: 16,
                }}
                placeholder="Ex: Viagem para Jericoacoara"
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
              />

              {/* Targets Row */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink2, marginBottom: 8 }}>Valor Alvo (R$)</Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      height: 48,
                      backgroundColor: colors.bg,
                      fontSize: 15,
                      color: colors.ink,
                    }}
                    placeholder="0,00"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink2, marginBottom: 8 }}>Valor Guardado (R$)</Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      height: 48,
                      backgroundColor: colors.bg,
                      fontSize: 15,
                      color: colors.ink,
                    }}
                    placeholder="0,00"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    value={currentAmount}
                    onChangeText={setCurrentAmount}
                  />
                </View>
              </View>

              {/* Deadline Partitions Input */}
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink2, marginBottom: 8 }}>Prazo (Opcional)</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      borderRadius: 14,
                      paddingHorizontal: 10,
                      height: 48,
                      backgroundColor: colors.bg,
                      fontSize: 15,
                      color: colors.ink,
                      textAlign: 'center',
                    }}
                    placeholder="Dia (DD)"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    value={day}
                    onChangeText={(text) => {
                      setDay(text.replace(/\D/g, '').slice(0, 2))
                      setError(null)
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      borderRadius: 14,
                      paddingHorizontal: 10,
                      height: 48,
                      backgroundColor: colors.bg,
                      fontSize: 15,
                      color: colors.ink,
                      textAlign: 'center',
                    }}
                    placeholder="Mês (MM)"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    value={month}
                    onChangeText={(text) => {
                      setMonth(text.replace(/\D/g, '').slice(0, 2))
                      setError(null)
                    }}
                  />
                </View>

                <View style={{ flex: 2 }}>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      borderRadius: 14,
                      paddingHorizontal: 10,
                      height: 48,
                      backgroundColor: colors.bg,
                      fontSize: 15,
                      color: colors.ink,
                      textAlign: 'center',
                    }}
                    placeholder="Ano (AAAA)"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    value={year}
                    onChangeText={(text) => {
                      setYear(text.replace(/\D/g, '').slice(0, 4))
                      setError(null)
                    }}
                  />
                </View>
              </View>

              {/* Color Picker */}
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink2, marginBottom: 8 }}>Cor</Text>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {PREDEFINED_COLORS.map((col) => {
                  const isSelected = selectedColor === col
                  return (
                    <Pressable
                      key={col}
                      onPress={() => setSelectedColor(col)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: col,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: colors.surface,
                        elevation: isSelected ? 4 : 0,
                        shadowColor: isSelected ? '#000' : 'transparent',
                        shadowOpacity: isSelected ? 0.2 : 0,
                        shadowRadius: 3,
                        shadowOffset: { width: 0, height: 1 }
                      }}
                    >
                      {isSelected && (
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FBFAF6' }} />
                      )}
                    </Pressable>
                  )
                })}
              </View>

              {/* Emoji Picker */}
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink2, marginBottom: 8 }}>Emoji</Text>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                {PREDEFINED_EMOJIS.map((em) => {
                  const isSelected = selectedEmoji === em && !customEmoji
                  return (
                    <Pressable
                      key={em}
                      onPress={() => {
                        setSelectedEmoji(em)
                        setCustomEmoji('')
                      }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isSelected ? 'rgba(21,21,26,0.1)' : 'rgba(21,21,26,0.04)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: isSelected ? 1 : 0,
                        borderColor: colors.ink,
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{em}</Text>
                    </Pressable>
                  )
                })}

                {/* Custom Emoji Input */}
                <TextInput
                  style={{
                    width: 50,
                    height: 36,
                    borderWidth: 1,
                    borderColor: customEmoji ? colors.ink : colors.hairline,
                    borderRadius: 10,
                    backgroundColor: colors.bg,
                    fontSize: 16,
                    textAlign: 'center',
                    padding: 0
                  }}
                  placeholder="Outro"
                  placeholderTextColor={colors.muted}
                  value={customEmoji}
                  maxLength={4}
                  onChangeText={(text) => {
                    setCustomEmoji(text)
                    setSelectedEmoji('')
                  }}
                />
              </View>

              {/* Delete Button (only if editing) */}
              {isEditing && onDelete && (
                <Pressable
                  onPress={handleDelete}
                  disabled={isPending || isDeleting}
                  style={({ pressed }) => ({
                    marginTop: 12,
                    height: 44,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(184,87,50,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(184,87,50,0.06)',
                    flexDirection: 'row',
                    gap: 6,
                    opacity: pressed || isPending || isDeleting ? 0.8 : 1,
                  })}
                >
                  {isDeleting ? (
                    <ActivityIndicator color={colors.neg} size="small" />
                  ) : (
                    <>
                      <Icon.Trash size={14} color={colors.neg} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.neg }}>Excluir Meta</Text>
                    </>
                  )}
                </Pressable>
              )}

            </ScrollView>

            {/* Pinned Action Buttons */}
            <View
              style={{
                paddingHorizontal: 22,
                paddingTop: 12,
                paddingBottom: Platform.OS === 'ios' ? 44 : 24,
                borderTopWidth: 1,
                borderTopColor: colors.hairline,
                backgroundColor: colors.surface,
              }}
            >
              {error && (
                <Text style={{ fontSize: 12, color: colors.neg, fontWeight: '500', marginBottom: 12 }}>
                  {error}
                </Text>
              )}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={onClose}
                  disabled={isPending || isDeleting}
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
                  onPress={handleSave}
                  disabled={isPending || isDeleting}
                  style={({ pressed }) => ({
                    flex: 1,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: colors.pos, // Botão verde de confirmar!
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed || isPending || isDeleting ? 0.8 : 1,
                  })}
                >
                  {isPending ? (
                    <ActivityIndicator color="#FBFAF6" size="small" />
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#FBFAF6' }}>Confirmar</Text>
                  )}
                </Pressable>
              </View>
            </View>

          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  )
}
