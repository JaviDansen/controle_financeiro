import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '../../src/components/ui/Icon';
import { colors } from '../../src/theme/colors';

type TxType = 'income' | 'expense';

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(iso: string) {
  const [y, m, d] = iso.split('-');
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const today = todayISO();
  if (iso === today) return 'Hoje';
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

function parseAmount(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits) / 100;
}

function formatAmount(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function NewTransactionStep1() {
  const router = useRouter();
  const statusBarHeight = StatusBar.currentHeight ?? 0;

  const [type, setType] = useState<TxType>('expense');
  const [amountRaw, setAmountRaw] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayISO());

  const glowColor = type === 'income' ? '#3D8B4E' : '#B85732';
  const typeActiveColor = type === 'income' ? colors.pos : colors.neg;

  function handleAmountChange(text: string) {
    const digits = text.replace(/\D/g, '');
    setAmountRaw(digits);
  }

  function handleNext() {
    if (!amountRaw || parseAmount(amountRaw) === 0) {
      return;
    }
    if (!title.trim()) return;

    router.push({
      pathname: '/(tabs)/new-transaction-step2',
      params: {
        type,
        amount: parseAmount(amountRaw).toString(),
        title: title.trim(),
        date,
      },
    });
  }

  const canNext = amountRaw.length > 0 && parseAmount(amountRaw) > 0 && title.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: statusBarHeight }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 22,
            paddingTop: 8,
            paddingBottom: 16,
          }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: colors.surface,
                borderWidth: 1, borderColor: colors.hairline,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon.ChevL size={16} color={colors.ink} sw={2.5} />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: '500', color: colors.ink, letterSpacing: -0.3 }}>
              Nova transação
            </Text>
            <View style={{
              backgroundColor: colors.ink,
              paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: 999,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.surface, letterSpacing: 0.5 }}>
                1 de 3
              </Text>
            </View>
          </View>

          {/* Toggle Receita / Despesa */}
          <View style={{
            marginHorizontal: 16,
            marginBottom: 20,
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1, borderColor: colors.hairline,
            padding: 4,
            flexDirection: 'row',
            gap: 4,
          }}>
            {(['expense', 'income'] as TxType[]).map(t => {
              const active = type === t;
              const activeColor = t === 'income' ? colors.pos : colors.neg;
              return (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: active ? activeColor : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <View style={{
                    width: 7, height: 7, borderRadius: 4,
                    backgroundColor: active ? 'rgba(255,255,255,0.8)' : activeColor,
                  }} />
                  <Text style={{
                    fontSize: 13, fontWeight: '500',
                    color: active ? '#fff' : colors.muted,
                  }}>
                    {t === 'income' ? 'Receita' : 'Despesa'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Card de valor */}
          <View style={{
            marginHorizontal: 16,
            marginBottom: 20,
            backgroundColor: colors.ink,
            borderRadius: 22,
            padding: 24,
            overflow: 'hidden',
          }}>
            {/* glow */}
            <View style={{
              position: 'absolute', top: -40, right: -40,
              width: 120, height: 120, borderRadius: 60,
              backgroundColor: glowColor,
              opacity: 0.15,
            }} />

            <Text style={{
              fontSize: 11, color: 'rgba(251,250,246,0.6)',
              fontWeight: '500', letterSpacing: 0.8, textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Valor
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ fontSize: 18, color: 'rgba(251,250,246,0.5)' }}>R$</Text>
              <TextInput
                value={formatAmount(amountRaw)}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor="rgba(251,250,246,0.25)"
                style={{
                  fontSize: 40, fontWeight: '500',
                  color: '#FBFAF6', letterSpacing: -1.6,
                  minWidth: 80, flex: 1,
                }}
              />
            </View>

            <Text style={{ marginTop: 12, fontSize: 11, color: 'rgba(251,250,246,0.4)' }}>
              Digite o valor da transação
            </Text>
          </View>

          {/* Descrição */}
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{
              fontSize: 11, fontWeight: '500', color: colors.muted,
              textTransform: 'uppercase', letterSpacing: 0.8,
              marginBottom: 6, paddingLeft: 4,
            }}>
              Descrição
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Mercado, Salário, Netflix..."
              placeholderTextColor={colors.muted}
              returnKeyType="next"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1.5,
                borderColor: title.length > 0 ? colors.ink : colors.hairline,
                borderRadius: 14,
                paddingHorizontal: 16, paddingVertical: 14,
                fontSize: 15, color: colors.ink,
              }}
            />
          </View>

          {/* Data */}
          <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
            <Text style={{
              fontSize: 11, fontWeight: '500', color: colors.muted,
              textTransform: 'uppercase', letterSpacing: 0.8,
              marginBottom: 6, paddingLeft: 4,
            }}>
              Data
            </Text>
            <Pressable
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1.5, borderColor: colors.hairline,
                borderRadius: 14,
                paddingHorizontal: 16, paddingVertical: 14,
                flexDirection: 'row', alignItems: 'center', gap: 10,
              }}
            >
              <Icon.Calendar size={16} color={colors.muted} sw={1.8} />
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.ink }}>
                {formatDateLabel(date)}
              </Text>
            </Pressable>
          </View>

          {/* Botão próximo */}
          <Pressable
            onPress={handleNext}
            disabled={!canNext}
            style={{
              marginHorizontal: 16,
              backgroundColor: canNext ? colors.ink : colors.hairline,
              borderRadius: 18,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text style={{
              fontSize: 15, fontWeight: '500',
              color: canNext ? colors.surface : colors.muted,
            }}>
              Próximo — Categoria
            </Text>
            <Icon.ChevR size={16} color={canNext ? colors.surface : colors.muted} sw={2.5} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
