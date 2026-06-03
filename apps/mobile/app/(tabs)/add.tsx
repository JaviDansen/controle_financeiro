import React, { useEffect, useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../src/theme/colors';
import {
  createCard,
  CreateCardPayload,
  updateCard,
  UpdateCardPayload,
} from '../../services/cards.service';
import { useAuthStore } from '../../store/auth.store';
import { useCards } from '../../hooks/useCards';

type CardType = 'credit' | 'debit';
type FormErrors = Partial<Record<'name' | 'bank' | 'holder' | 'expiry' | 'creditLimit' | 'closingDay' | 'dueDay', string>>;

const DEFAULT_GRADIENT_FROM = '#15151A';
const DEFAULT_GRADIENT_TO = '#0A0A0A';
const DEFAULT_ACCENT = '#3D8B4E';

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`.slice(0, 5);
}

function getExpiryError(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if (!/^\d{2}\/\d{2}$/.test(trimmed)) {
    return 'Informe a validade no formato MM/AA.';
  }

  const [monthText, yearText] = trimmed.split('/');
  const month = Number(monthText);
  const year = 2000 + Number(yearText);

  if (month < 1 || month > 12) {
    return 'Informe um mes entre 01 e 12.';
  }

  const now = new Date();
  const currentMonthIndex = now.getFullYear() * 12 + now.getMonth();
  const expiryMonthIndex = year * 12 + (month - 1);

  if (expiryMonthIndex < currentMonthIndex) {
    return 'Informe uma validade atual ou futura.';
  }

  return undefined;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  error?: string;
  maxLength?: number;
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

export default function AddCardScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const { data: cards = [], isLoading: isCardsLoading } = useCards();
  const editingCard = typeof id === 'string' ? cards.find((card) => card.id === id) : undefined;
  const isEditing = typeof id === 'string';

  const [type, setType] = useState<CardType>('credit');
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!editingCard) {
      return;
    }

    setType(editingCard.type);
    setName(editingCard.name ?? '');
    setBank(editingCard.bank ?? '');
    setLastFour(editingCard.last4 ?? '');
    setHolder(editingCard.holder ?? '');
    setExpiry(editingCard.expiry ?? '');
    setCreditLimit(editingCard.limit !== null ? String(editingCard.limit) : '');
    setClosingDay(editingCard.closingDay !== null ? String(editingCard.closingDay) : '');
    setDueDay(editingCard.dueDay !== null ? String(editingCard.dueDay) : '');
    setErrors({});
  }, [editingCard]);

  useEffect(() => {
    if (!isEditing || isCardsLoading || editingCard) {
      return;
    }

    Alert.alert('Cartao nao encontrado', 'Nao foi possivel localizar o cartao selecionado.');
    router.replace('/(tabs)/cards');
  }, [editingCard, isCardsLoading, isEditing, router]);

  const createCardMutation = useMutation({
    mutationFn: async (payload: CreateCardPayload) => {
      if (!token) {
        throw new Error('Sessao invalida. Faca login novamente.');
      }

      return createCard(payload, token);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cards'] });
      router.replace('/(tabs)/cards');
    },
    onError: (error) => {
      Alert.alert('Erro ao salvar', error instanceof Error ? error.message : 'Nao foi possivel criar o cartao.');
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async (payload: UpdateCardPayload) => {
      if (!token || !id || typeof id !== 'string') {
        throw new Error('Sessao invalida. Faca login novamente.');
      }

      return updateCard(id, payload, token);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cards'] });
      router.replace('/(tabs)/cards');
    },
    onError: (error) => {
      Alert.alert('Erro ao salvar', error instanceof Error ? error.message : 'Nao foi possivel atualizar o cartao.');
    },
  });

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const expiryError = getExpiryError(expiry);

    if (!name.trim()) {
      nextErrors.name = 'Informe o nome do cartao.';
    }

    if (!bank.trim()) {
      nextErrors.bank = 'Informe o banco.';
    }

    if (!holder.trim()) {
      nextErrors.holder = 'Informe o titular.';
    }

    if (expiryError) {
      nextErrors.expiry = expiryError;
    }

    if (type === 'credit' && !creditLimit.trim()) {
      nextErrors.creditLimit = 'Informe o limite.';
    }

    if (type === 'credit' && !closingDay.trim()) {
      nextErrors.closingDay = 'Informe o dia de fechamento.';
    }

    if (type === 'credit' && !dueDay.trim()) {
      nextErrors.dueDay = 'Informe o dia de vencimento.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const payload: CreateCardPayload = {
      name: name.trim(),
      bank: bank.trim(),
      type,
      lastFour: lastFour.replace(/\D/g, '').slice(0, 4) || '0000',
      holder: holder.trim(),
      expiry: expiry.trim() || undefined,
      gradientFrom: DEFAULT_GRADIENT_FROM,
      gradientTo: DEFAULT_GRADIENT_TO,
      accent: DEFAULT_ACCENT,
    };

    if (type === 'credit') {
      payload.creditLimit = Number(creditLimit.replace(',', '.'));
      payload.closingDay = Number(closingDay);
      payload.dueDay = Number(dueDay);
    }

    if (isEditing) {
      updateCardMutation.mutate(payload);
      return;
    }

    createCardMutation.mutate(payload);
  };

  const isPending = createCardMutation.isPending || updateCardMutation.isPending;

  if (isEditing && isCardsLoading && !editingCard) {
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
        <View
          style={{
            height: 64,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>
            {isEditing ? 'Editar cartao' : 'Novo cartao'}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 16 }}
        >
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surface,
              borderRadius: 999,
              padding: 4,
              gap: 4,
            }}
          >
            {(['credit', 'debit'] as const).map((option) => {
              const active = type === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    setType(option);
                    setErrors((current) => ({
                      ...current,
                      creditLimit: undefined,
                      closingDay: undefined,
                      dueDay: undefined,
                    }));
                  }}
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 999,
                    backgroundColor: active ? colors.ink : colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      color: active ? colors.surface : colors.ink,
                      fontWeight: '500',
                    }}
                  >
                    {option === 'credit' ? 'Credito' : 'Debito'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Field
            label="Nome"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setErrors((current) => ({ ...current, name: undefined }));
            }}
            placeholder="Novo cartao"
            error={errors.name}
          />
          <Field
            label="Banco"
            value={bank}
            onChangeText={(value) => {
              setBank(value);
              setErrors((current) => ({ ...current, bank: undefined }));
            }}
            placeholder="Nubank"
            error={errors.bank}
          />
          <Field
            label="Final"
            value={lastFour}
            onChangeText={(value) => {
              setLastFour(value.replace(/\D/g, '').slice(0, 4));
            }}
            placeholder="1234"
            keyboardType="numeric"
            maxLength={4}
          />
          <Field
            label="Titular"
            value={holder}
            onChangeText={(value) => {
              setHolder(value);
              setErrors((current) => ({ ...current, holder: undefined }));
            }}
            placeholder="Seu nome"
            error={errors.holder}
          />
          <Field
            label="Validade"
            value={expiry}
            onChangeText={(value) => {
              setExpiry(formatExpiry(value));
              setErrors((current) => ({ ...current, expiry: undefined }));
            }}
            placeholder="12/30"
            keyboardType="numeric"
            maxLength={5}
            error={errors.expiry}
          />

          {type === 'credit' ? (
            <>
              <Field
                label="Limite"
                value={creditLimit}
                onChangeText={(value) => {
                  setCreditLimit(value.replace(/[^0-9,.-]/g, ''));
                  setErrors((current) => ({ ...current, creditLimit: undefined }));
                }}
                placeholder="5000"
                keyboardType="numeric"
                error={errors.creditLimit}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Fechamento"
                    value={closingDay}
                    onChangeText={(value) => {
                      setClosingDay(value.replace(/\D/g, '').slice(0, 2));
                      setErrors((current) => ({ ...current, closingDay: undefined }));
                    }}
                    placeholder="10"
                    keyboardType="numeric"
                    error={errors.closingDay}
                    maxLength={2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Vencimento"
                    value={dueDay}
                    onChangeText={(value) => {
                      setDueDay(value.replace(/\D/g, '').slice(0, 2));
                      setErrors((current) => ({ ...current, dueDay: undefined }));
                    }}
                    placeholder="17"
                    keyboardType="numeric"
                    error={errors.dueDay}
                    maxLength={2}
                  />
                </View>
              </View>
            </>
          ) : null}

          {isPending ? (
            <View style={{ paddingVertical: 8, alignItems: 'center' }}>
              <ActivityIndicator color={colors.ink} />
            </View>
          ) : null}
        </ScrollView>

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
            <Text style={{ fontSize: 16, color: colors.muted, fontWeight: '500' }}>Cancelar</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={isPending}
            style={{
              flex: 1,
              height: 54,
              borderRadius: 18,
              backgroundColor: isPending ? colors.hairline : colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16, color: colors.surface, fontWeight: '600' }}>
              {isEditing ? 'Atualizar' : 'Salvar'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
