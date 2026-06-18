import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '../../src/components/ui/Icon';
import { colors } from '../../src/theme/colors';
import { useAuthStore } from '../../store/auth.store';
import { createTransaction, TransactionStatus } from '../../services/transactions.service';
import { getCategoryIcon } from '../../src/lib/categoryIcons';

type Status = TransactionStatus;

const STATUS_OPTIONS: { id: Status; label: string; emoji: string }[] = [
  { id: 'confirmed', label: 'Confirmada', emoji: '✓' },
  { id: 'pending',   label: 'Pendente',   emoji: '⏳' },
  { id: 'cancelled', label: 'Cancelada',  emoji: '✕' },
];

const STATUS_COLORS: Record<Status, { bg: string; border: string; text: string }> = {
  confirmed: { bg: '#DDF0E4', border: '#3D8B4E', text: '#1E5229' },
  pending:   { bg: '#F5F0DC', border: '#9A8030', text: '#5A4A10' },
  cancelled: { bg: '#F7E8E0', border: '#B85732', text: '#7A2F10' },
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix',
  transfer: 'Transferência',
  boleto: 'Boleto',
};

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split('-');
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;
}

function DetailRow({ iconSlot, label, children, rawIcon = false }: {
  iconSlot: React.ReactNode;
  label: string;
  children: React.ReactNode;
  rawIcon?: boolean;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 13,
      borderBottomWidth: 1, borderBottomColor: 'rgba(21,21,26,0.06)',
    }}>
      {rawIcon ? (
        <View style={{ marginRight: 10 }}>{iconSlot}</View>
      ) : (
        <View style={{
          width: 32, height: 32, borderRadius: 10,
          backgroundColor: colors.hairline,
          alignItems: 'center', justifyContent: 'center',
          marginRight: 10,
        }}>
          {iconSlot}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 1 }}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

export default function NewTransactionStep3() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);
  const statusBarHeight = StatusBar.currentHeight ?? 0;

  const params = useLocalSearchParams<{
    type: string; amount: string; title: string; date: string;
    categoryId: string; categoryName: string; categoryColor: string; categoryIcon: string;
    cardId: string; paymentType: string;
    notes: string; isRecurring: string;
  }>();

  const [status, setStatus] = useState<Status>('confirmed');
  const [saved, setSaved] = useState(false);

  const typeColor = params.type === 'income' ? colors.pos : colors.neg;
  const typeLabel = params.type === 'income' ? 'Receita' : 'Despesa';
  const amount = parseFloat(params.amount);
  const CatIcon = getCategoryIcon(params.categoryIcon || null);

  const paymentLabel = params.cardId
    ? null
    : params.paymentType
      ? PAYMENT_LABELS[params.paymentType] ?? null
      : null;

  const month = params.date?.slice(0, 7);

  const mutation = useMutation({
    mutationFn: () => createTransaction({
      title: params.title,
      amount,
      type: params.type as 'income' | 'expense',
      categoryId: params.categoryId,
      cardId: params.cardId || null,
      date: params.date,
      notes: params.notes || undefined,
      isRecurring: params.isRecurring === '1',
      status,
    }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', month] });
      setSaved(true);
      setTimeout(() => {
        router.replace('/(tabs)/transactions');
      }, 1400);
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: statusBarHeight }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 22, paddingTop: 8, paddingBottom: 20,
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
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '500', color: colors.ink, letterSpacing: -0.3 }}>
              Revisar
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>
              Confirme antes de salvar
            </Text>
          </View>
          <View style={{ backgroundColor: colors.pos, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff', letterSpacing: 0.5 }}>
              3 de 3
            </Text>
          </View>
        </View>

        {/* Hero */}
        <View style={{
          marginHorizontal: 16, marginBottom: 20,
          backgroundColor: colors.ink, borderRadius: 22, padding: 24, overflow: 'hidden',
        }}>
          <View style={{
            position: 'absolute', top: -40, right: -40,
            width: 130, height: 130, borderRadius: 65,
            backgroundColor: typeColor, opacity: 0.15,
          }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: typeColor }} />
              <Text style={{ fontSize: 11, fontWeight: '500', color: 'rgba(251,250,246,0.7)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {typeLabel}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 17, fontWeight: '500', color: '#FBFAF6', letterSpacing: -0.3 }}>
            {params.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 20 }}>
            <Text style={{ fontSize: 18, color: 'rgba(251,250,246,0.5)' }}>R$</Text>
            <Text style={{ fontSize: 40, fontWeight: '500', color: '#FBFAF6', letterSpacing: -1.6, lineHeight: 44 }}>
              {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Detalhes */}
        <View style={{
          marginHorizontal: 16, marginBottom: 12,
          backgroundColor: colors.surface,
          borderRadius: 18, borderWidth: 1, borderColor: colors.hairline,
          overflow: 'hidden',
        }}>
          {/* Categoria */}
          <DetailRow
            rawIcon
            label="Categoria"
            iconSlot={
              <View style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: params.categoryColor,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <CatIcon size={15} color="#fff" strokeWidth={2} />
              </View>
            }
          >
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>{params.categoryName}</Text>
          </DetailRow>

          {/* Pagamento */}
          <DetailRow label={params.cardId ? 'Cartão' : 'Pagamento'} iconSlot={<Icon.Card size={14} color={colors.muted} />}>
            {params.cardId ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 3, height: 18, borderRadius: 999, backgroundColor: colors.muted }} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>Cartão vinculado</Text>
              </View>
            ) : paymentLabel ? (
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>{paymentLabel}</Text>
            ) : (
              <Text style={{ fontSize: 14, color: colors.muted }}>Sem pagamento</Text>
            )}
          </DetailRow>

          {/* Data */}
          <DetailRow label="Data" iconSlot={<Icon.Calendar size={14} color={colors.muted} />}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>
              {formatDateBR(params.date)}
            </Text>
          </DetailRow>

          {/* Notas */}
          <DetailRow label="Notas" iconSlot={<Icon.Filter size={14} color={colors.muted} />}>
            <Text style={{ fontSize: 14, color: params.notes ? colors.ink : colors.muted, fontWeight: params.notes ? '500' : '400' }}>
              {params.notes || '—'}
            </Text>
          </DetailRow>

          {/* Recorrente — sem borda inferior */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 13,
          }}>
            <View style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: colors.hairline,
              alignItems: 'center', justifyContent: 'center',
              marginRight: 10,
            }}>
              <Icon.Tx size={14} color={colors.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 1 }}>Recorrente</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>
                {params.isRecurring === '1' ? 'Sim' : 'Não'}
              </Text>
            </View>
          </View>
        </View>

        {/* Status */}
        <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
          <Text style={{
            fontSize: 11, fontWeight: '500', color: colors.muted,
            textTransform: 'uppercase', letterSpacing: 0.8,
            marginBottom: 8, paddingLeft: 4,
          }}>
            Status da transação
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {STATUS_OPTIONS.map(opt => {
              const active = status === opt.id;
              const c = STATUS_COLORS[opt.id];
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setStatus(opt.id)}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: active ? c.border : colors.hairline,
                    backgroundColor: active ? c.bg : colors.surface,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18, marginBottom: 4 }}>{opt.emoji}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: active ? c.text : colors.muted }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Ações */}
        <View style={{ marginHorizontal: 16, gap: 10 }}>
          {saved ? (
            <View style={{
              borderRadius: 18, paddingVertical: 16,
              backgroundColor: colors.pos,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Icon.Check size={16} color="#fff" sw={2.5} />
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#fff' }}>Transação salva!</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => mutation.mutate()}
              disabled={mutation.isPending}
              style={{
                borderRadius: 18, paddingVertical: 16,
                backgroundColor: colors.ink,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: mutation.isPending ? 0.7 : 1,
              }}
            >
              {mutation.isPending ? (
                <ActivityIndicator size="small" color="#FBFAF6" />
              ) : (
                <Icon.Check size={16} color="#FBFAF6" sw={2.5} />
              )}
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.surface }}>
                {mutation.isPending ? 'Salvando...' : 'Salvar transação'}
              </Text>
            </Pressable>
          )}

          {mutation.isError && (
            <Text style={{ fontSize: 13, color: colors.neg, textAlign: 'center' }}>
              {(mutation.error as Error)?.message ?? 'Erro ao salvar. Tente novamente.'}
            </Text>
          )}

          <Pressable
            onPress={() => router.back()}
            disabled={mutation.isPending || saved}
            style={{
              borderRadius: 18, paddingVertical: 14,
              borderWidth: 1.5, borderColor: colors.hairline,
              alignItems: 'center',
              opacity: mutation.isPending || saved ? 0.4 : 1,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.muted }}>Editar dados</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}
