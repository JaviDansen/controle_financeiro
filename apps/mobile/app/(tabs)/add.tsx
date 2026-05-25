import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../src/theme/colors';
import { createCard, CreateCardPayload } from '../../services/cards.service';
import { useAuthStore } from '../../store/auth.store';

type CardType = 'credit' | 'debit';

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
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
        style={{
          height: 54,
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.hairline,
          paddingHorizontal: 16,
          fontSize: 16,
          color: colors.ink2,
        }}
      />
    </View>
  );
}

export default function AddCardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const [type, setType] = useState<CardType>('credit');
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');

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

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Campo obrigatorio', 'Informe o nome do cartao.');
      return;
    }

    if (!bank.trim()) {
      Alert.alert('Campo obrigatorio', 'Informe o banco.');
      return;
    }

    if (lastFour && lastFour.replace(/\D/g, '').length !== 4) {
      Alert.alert('Final invalido', 'Os 4 ultimos digitos devem ter exatamente 4 numeros.');
      return;
    }

    const payload: CreateCardPayload = {
      name: name.trim(),
      bank: bank.trim(),
      type,
      lastFour: lastFour ? lastFour.replace(/\D/g, '').slice(0, 4) : undefined,
      holder: holder.trim() || undefined,
      expiry: expiry.trim() || undefined,
      gradientFrom: '#15151A',
      gradientTo: '#0A0A0A',
      accent: '#3D8B4E',
    };

    if (type === 'credit') {
      payload.creditLimit = creditLimit ? Number(creditLimit.replace(',', '.')) : undefined;
      payload.closingDay = closingDay ? Number(closingDay) : undefined;
      payload.dueDay = dueDay ? Number(dueDay) : undefined;
    }

    createCardMutation.mutate(payload);
  };

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
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>Novo cartao</Text>
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
                  onPress={() => setType(option)}
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

          <Field label="Nome" value={name} onChangeText={setName} placeholder="Novo Cartão" />
          <Field label="Banco" value={bank} onChangeText={setBank} placeholder="Nubank" />
          <Field
            label="Final"
            value={lastFour}
            onChangeText={(value) => setLastFour(value.replace(/\D/g, '').slice(0, 4))}
            placeholder="1234"
            keyboardType="numeric"
          />
          <Field label="Titular" value={holder} onChangeText={setHolder} placeholder="Seu nome" />
          <Field label="Validade" value={expiry} onChangeText={setExpiry} placeholder="12/30" />

          {type === 'credit' ? (
            <>
              <Field
                label="Limite"
                value={creditLimit}
                onChangeText={setCreditLimit}
                placeholder="5000"
                keyboardType="numeric"
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Fechamento"
                    value={closingDay}
                    onChangeText={(value) => setClosingDay(value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="10"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Vencimento"
                    value={dueDay}
                    onChangeText={(value) => setDueDay(value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="17"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </>
          ) : null}

          {createCardMutation.isPending ? (
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
            disabled={createCardMutation.isPending}
            style={{
              flex: 1,
              height: 54,
              borderRadius: 18,
              backgroundColor: createCardMutation.isPending ? colors.hairline : colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16, color: colors.surface, fontWeight: '600' }}>Salvar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
