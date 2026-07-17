import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { Icon } from '../../src/components/ui/Icon';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '../../hooks/useGoals';
import { parseDateLabelToYmd } from '../../services/goals.service';

const PREDEFINED_COLORS = [
  '#C07830', // Laranja/Bronze
  '#3D8B4E', // Verde
  '#4B5EA0', // Azul
  '#2E7A8A', // Teal
  '#B85732', // Terracota
  '#8B57B8', // Roxo
  '#15151A', // Preto
];

const PREDEFINED_EMOJIS = ['🎯', '💰', '🏡', '🚗', '✈️', '💻', '🎓', '🎁', '📈'];

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function buildDeadlineDate(
  dayStr: string,
  monthStr: string,
  yearStr: string
): { date: string | null; error: string | null } {
  const dayVal = dayStr.trim();
  const monthVal = monthStr.trim();
  const yearVal = yearStr.trim();

  if (!dayVal && !monthVal && !yearVal) {
    return { date: null, error: null };
  }

  if (!yearVal) {
    return { date: null, error: 'O ano é obrigatório para definir um prazo.' };
  }

  const year = parseInt(yearVal, 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return { date: null, error: 'Ano inválido (deve ser entre 2000 e 2100).' };
  }

  if (dayVal && !monthVal) {
    return { date: null, error: 'Não é permitido informar o dia sem o mês.' };
  }

  if (!monthVal && !dayVal) {
    return { date: `${year}-12-31`, error: null };
  }

  const month = parseInt(monthVal, 10);
  if (isNaN(month) || month < 1 || month > 12) {
    return { date: null, error: 'Mês inválido (deve ser entre 01 e 12).' };
  }

  if (!dayVal) {
    const lastDay = getLastDayOfMonth(year, month);
    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(lastDay).padStart(2, '0');
    return { date: `${year}-${formattedMonth}-${formattedDay}`, error: null };
  }

  const day = parseInt(dayVal, 10);
  const lastDay = getLastDayOfMonth(year, month);
  if (isNaN(day) || day < 1 || day > lastDay) {
    return {
      date: null,
      error: `Dia inválido para o mês informado (deve ser entre 01 e ${lastDay}).`,
    };
  }

  const formattedMonth = String(month).padStart(2, '0');
  const formattedDay = String(day).padStart(2, '0');
  return { date: `${year}-${formattedMonth}-${formattedDay}`, error: null };
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
  maxLength,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  error?: string;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontSize: 10,
          color: colors.muted,
          textTransform: 'uppercase',
          letterSpacing: 1.1,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        style={{
          height: 54,
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: error ? '#C84B31' : colors.hairline,
          paddingHorizontal: 16,
          fontSize: 16,
          color: colors.ink2,
        }}
      />
      {error ? <Text style={{ fontSize: 12, color: '#C84B31' }}>{error}</Text> : null}
    </View>
  );
}

export default function AddGoalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  
  const { data: goals = [], isLoading: isGoalsLoading } = useGoals();
  const editingGoal = typeof id === 'string' ? goals.find((goal) => goal.id === id) : undefined;
  const isEditing = typeof id === 'string';

  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState(PREDEFINED_COLORS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState(PREDEFINED_EMOJIS[0]);
  const [customEmoji, setCustomEmoji] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingGoal) {
      return;
    }

    setTitle(editingGoal.title);
    setTargetAmount(String(editingGoal.target));
    setCurrentAmount(String(editingGoal.current));
    setCategory('geral');
    setSelectedColor(editingGoal.color);

    const ymd = parseDateLabelToYmd(editingGoal.deadline);
    if (ymd) {
      const [y, m, d] = ymd.split('-');
      setYear(y);
      setMonth(m);
      setDay(d);
    } else {
      setYear('');
      setMonth('');
      setDay('');
    }

    if (PREDEFINED_EMOJIS.includes(editingGoal.emoji)) {
      setSelectedEmoji(editingGoal.emoji);
      setCustomEmoji('');
    } else {
      setSelectedEmoji('');
      setCustomEmoji(editingGoal.emoji);
    }
  }, [editingGoal]);

  const handleSave = async () => {
    setError(null);
    const target = parseFloat(targetAmount.replace(',', '.'));
    const current = parseFloat(currentAmount.replace(',', '.'));

    if (!title.trim()) {
      setError('O título é obrigatório.');
      return;
    }

    if (isNaN(target) || target <= 0) {
      setError('O valor alvo deve ser maior que zero.');
      return;
    }

    if (isNaN(current) || current < 0) {
      setError('O valor guardado não pode ser negativo.');
      return;
    }

    if (current > target) {
      setError('O valor guardado não pode exceder o valor alvo.');
      return;
    }

    const { date: deadlineDate, error: dateError } = buildDeadlineDate(day, month, year);
    if (dateError) {
      setError(dateError);
      return;
    }

    const payload = {
      title: title.trim(),
      targetAmount: target,
      currentAmount: current,
      deadline: deadlineDate,
      category: category.trim() || 'geral',
      color: selectedColor,
      emoji: customEmoji.trim() || selectedEmoji,
      isActive: editingGoal ? editingGoal.active : true,
    };

    try {
      if (editingGoal) {
        const apiPayload = {
          title: payload.title,
          targetAmount: payload.targetAmount,
          currentAmount: payload.currentAmount,
          deadline: payload.deadline,
          category: payload.category,
          color: payload.color,
          emoji: payload.emoji,
          isActive: payload.isActive,
        };
        await updateMutation.mutateAsync({ id: editingGoal.id, payload: apiPayload });
        Alert.alert('Meta atualizada', 'A meta foi atualizada com sucesso.');
      } else {
        await createMutation.mutateAsync(payload);
        Alert.alert('Meta criada', 'A meta foi cadastrada com sucesso.');
      }
      router.replace('/(tabs)/goals');
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao salvar a meta.');
    }
  };

  const handleDelete = () => {
    if (!editingGoal) return;
    Alert.alert(
      'Excluir meta',
      'Tem certeza que deseja excluir esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            try {
              await deleteMutation.mutateAsync(editingGoal.id);
              Alert.alert('Meta excluída', 'A meta foi excluída com sucesso.');
              router.replace('/(tabs)/goals');
            } catch (err: any) {
              setError(err?.message ?? 'Erro ao excluir a meta.');
            }
          },
        },
      ]
    );
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (isEditing && isGoalsLoading && !editingGoal) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.ink} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View
          style={{
            height: 64,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.hairline,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.hairline,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon.ChevL size={16} color={colors.ink} sw={2.5} />
          </Pressable>

          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>
            {isEditing ? 'Editar meta' : 'Nova meta'}
          </Text>

          {isEditing ? (
            <Pressable
              onPress={handleDelete}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(184,87,50,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(184,87,50,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon.Trash size={16} color={colors.neg} />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 24 }}
        >
          {/* Título */}
          <Field
            label="Título"
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Viagem para Jericoacoara"
          />

          {/* Valores */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Valor Alvo (R$)"
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder="0,00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Valor Guardado (R$)"
                value={currentAmount}
                onChangeText={setCurrentAmount}
                placeholder="0,00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Prazo */}
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 10,
                color: colors.muted,
                textTransform: 'uppercase',
                letterSpacing: 1.1,
                fontWeight: '500',
              }}
            >
              Prazo (Opcional)
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={day}
                  onChangeText={(text) => {
                    setDay(text.replace(/\D/g, '').slice(0, 2));
                    setError(null);
                  }}
                  placeholder="Dia (DD)"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={2}
                  style={{
                    height: 54,
                    borderRadius: 18,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    textAlign: 'center',
                    fontSize: 16,
                    color: colors.ink2,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={month}
                  onChangeText={(text) => {
                    setMonth(text.replace(/\D/g, '').slice(0, 2));
                    setError(null);
                  }}
                  placeholder="Mês (MM)"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={2}
                  style={{
                    height: 54,
                    borderRadius: 18,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    textAlign: 'center',
                    fontSize: 16,
                    color: colors.ink2,
                  }}
                />
              </View>
              <View style={{ flex: 2 }}>
                <TextInput
                  value={year}
                  onChangeText={(text) => {
                    setYear(text.replace(/\D/g, '').slice(0, 4));
                    setError(null);
                  }}
                  placeholder="Ano (AAAA)"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  maxLength={4}
                  style={{
                    height: 54,
                    borderRadius: 18,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    textAlign: 'center',
                    fontSize: 16,
                    color: colors.ink2,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Cor */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 10,
                color: colors.muted,
                textTransform: 'uppercase',
                letterSpacing: 1.1,
                fontWeight: '500',
              }}
            >
              Cor
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {PREDEFINED_COLORS.map((col) => {
                const isSelected = selectedColor === col;
                return (
                  <Pressable
                    key={col}
                    onPress={() => setSelectedColor(col)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: col,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: isSelected ? 3 : 0,
                      borderColor: colors.bg,
                      elevation: isSelected ? 4 : 0,
                      shadowColor: isSelected ? '#000' : 'transparent',
                      shadowOpacity: isSelected ? 0.2 : 0,
                      shadowRadius: 3,
                      shadowOffset: { width: 0, height: 1 },
                    }}
                  >
                    {isSelected && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#FBFAF6',
                        }}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Emoji */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 10,
                color: colors.muted,
                textTransform: 'uppercase',
                letterSpacing: 1.1,
                fontWeight: '500',
              }}
            >
              Emoji
            </Text>
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {PREDEFINED_EMOJIS.map((em) => {
                const isSelected = selectedEmoji === em && !customEmoji;
                return (
                  <Pressable
                    key={em}
                    onPress={() => {
                      setSelectedEmoji(em);
                      setCustomEmoji('');
                    }}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: isSelected
                        ? 'rgba(21,21,26,0.1)'
                        : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected ? colors.ink : colors.hairline,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{em}</Text>
                  </Pressable>
                );
              })}

              <TextInput
                value={customEmoji}
                maxLength={4}
                onChangeText={(text) => {
                  setCustomEmoji(text);
                  setSelectedEmoji('');
                }}
                placeholder="Outro"
                placeholderTextColor={colors.muted}
                style={{
                  width: 58,
                  height: 42,
                  borderWidth: 1,
                  borderColor: customEmoji ? colors.ink : colors.hairline,
                  borderRadius: 14,
                  backgroundColor: colors.surface,
                  fontSize: 16,
                  textAlign: 'center',
                  padding: 0,
                }}
              />
            </View>
          </View>
        </ScrollView>

        {/* Rodapé de Ações */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 20,
            borderTopWidth: 1,
            borderTopColor: colors.hairline,
            backgroundColor: colors.bg,
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            disabled={isPending}
            style={{
              flex: 1,
              height: 54,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.hairline,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16, color: colors.muted, fontWeight: '500' }}>
              Cancelar
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={isPending}
            style={{
              flex: 1,
              height: 54,
              borderRadius: 18,
              backgroundColor: isPending ? colors.hairline : colors.pos,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPending ? (
              <ActivityIndicator color="#FBFAF6" size="small" />
            ) : (
              <Text style={{ fontSize: 16, color: '#FBFAF6', fontWeight: '600' }}>
                Confirmar
              </Text>
            )}
          </Pressable>
        </View>

        {error && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={{ fontSize: 14, color: '#C84B31', fontWeight: '500' }}>
              {error}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
