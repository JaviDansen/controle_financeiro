import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { Icon } from '../../src/components/ui/Icon';
import { useGoals, useUpdateGoal } from '../../hooks/useGoals';
import { fmtBRLShort } from '../../src/lib/currency';

export default function ApportScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { data: goals = [], isLoading: isGoalsLoading } = useGoals();
  const goal = goals.find((g) => g.id === id) ?? null;

  const updateMutation = useUpdateGoal();

  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isGoalsLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.ink} />
        </View>
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 }}>
          <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center', marginBottom: 16 }}>
            Meta não encontrada.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 20,
              backgroundColor: colors.ink,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#FBFAF6', fontWeight: '600' }}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const remaining = goal.target - goal.current;

  const handleConfirm = async () => {
    setError(null);
    const parsedAmount = parseFloat(value.replace(',', '.'));
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor, insira um valor válido e maior que zero.');
      return;
    }

    if (goal.current + parsedAmount > goal.target) {
      setError(`O aporte não pode exceder o valor restante de R$ ${fmtBRLShort(remaining)}.`);
      return;
    }

    const newCurrent = goal.current + parsedAmount;
    const apiPayload = {
      currentAmount: newCurrent,
      isActive: newCurrent >= goal.target ? false : goal.active,
    };

    try {
      await updateMutation.mutateAsync({ id: goal.id, payload: apiPayload });
      Alert.alert('Aporte realizado', 'O aporte foi realizado com sucesso!');
      router.replace('/(tabs)/goals');
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao realizar o aporte.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
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
            Aporte rápido
          </Text>

          <View style={{ width: 36 }} />
        </View>

        {/* Content */}
        <View style={{ flex: 1, padding: 22, gap: 20 }}>
          {/* Goal Summary Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: `${goal.color}20`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20 }}>{goal.emoji}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>
                {goal.title}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                Meta de R$ {fmtBRLShort(goal.target)}
              </Text>
            </View>
          </View>

          {/* Target Status info */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.hairline,
              borderRadius: 18,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ fontSize: 10, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
                Faltam
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 4 }}>
                R$ {fmtBRLShort(remaining)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10, color: colors.muted, textTransform: 'uppercase', textAlign: 'right', letterSpacing: 1 }}>
                Guardado
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '500', color: colors.muted, marginTop: 4, textAlign: 'right' }}>
                R$ {fmtBRLShort(goal.current)}
              </Text>
            </View>
          </View>

          {/* Input field */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
              Valor do aporte
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: error ? colors.neg : colors.hairline,
                borderRadius: 18,
                paddingHorizontal: 16,
                height: 56,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '500', color: colors.muted, marginRight: 6 }}>R$</Text>
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 18,
                  fontWeight: '600',
                  color: colors.ink,
                  paddingVertical: 0,
                }}
                placeholder="0,00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                value={value}
                onChangeText={(text) => {
                  setValue(text);
                  setError(null);
                }}
                autoFocus
              />
            </View>
            {error && (
              <Text style={{ fontSize: 13, color: colors.neg, fontWeight: '500', marginTop: 4 }}>
                {error}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
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
            disabled={updateMutation.isPending}
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
            onPress={handleConfirm}
            disabled={updateMutation.isPending}
            style={{
              flex: 1,
              height: 54,
              borderRadius: 18,
              backgroundColor: updateMutation.isPending ? colors.hairline : colors.pos,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#FBFAF6" size="small" />
            ) : (
              <Text style={{ fontSize: 16, color: '#FBFAF6', fontWeight: '600' }}>
                Confirmar
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
