import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '../../src/components/ui/Icon';
import { colors } from '../../src/theme/colors';
import { fmtBRLShort } from '../../src/lib/currency';
import { useCards } from '../../hooks/useCards';
import { deleteCard } from '../../services/cards.service';
import { useAuthStore } from '../../store/auth.store';

function formatShortDate(value: string | null) {
  if (!value) {
    return '--';
  }

  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return '--';
  }

  return `${day}/${month}`;
}

export default function CardsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const { data: cards = [], isLoading } = useCards();
  const [activeIdx, setActiveIdx] = useState(0);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  useEffect(() => {
    if (activeIdx > cards.length - 1) {
      setActiveIdx(0);
    }
  }, [activeIdx, cards.length]);

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      if (!token) {
        throw new Error('Sessao invalida. Faca login novamente.');
      }

      return deleteCard(cardId, token);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cards'] });
      setActiveIdx(0);
      Alert.alert('Cartao removido', 'O cartao foi removido com sucesso.');
    },
    onError: (error) => {
      Alert.alert('Erro ao excluir', error instanceof Error ? error.message : 'Nao foi possivel excluir o cartao.');
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}
        edges={['top']}
      >
        <ActivityIndicator size="large" color={colors.ink} />
      </SafeAreaView>
    );
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 22,
            paddingTop: 8,
            paddingBottom: 4,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '500', color: colors.ink, letterSpacing: -0.8 }}>
            Cartoes
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/add')}
            style={{
              height: 38,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: colors.ink,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon.Plus size={16} color="#FBFAF6" sw={2.2} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#FBFAF6' }}>Novo</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center', paddingHorizontal: 40 }}>
            Voce ainda nao tem cartoes cadastrados.{'\n'}Toque em Novo para adicionar.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeCard = cards[activeIdx] ?? cards[0];

  const handleDelete = () => {
    Alert.alert('Excluir cartao', 'Deseja realmente excluir este cartao?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteCardMutation.mutate(activeCard.id);
        },
      },
    ]);
  };

  const handleEdit = () => {
    setIsActionsOpen(false);
    router.push({ pathname: '/(tabs)/add', params: { id: activeCard.id } });
  };

  const handleRemoveAction = () => {
    setIsActionsOpen(false);
    handleDelete();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 22,
            paddingTop: 8,
            paddingBottom: 4,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '500', color: colors.ink, letterSpacing: -0.8 }}>
            Cartoes
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/add')}
            style={{
              height: 38,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: colors.ink,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon.Plus size={16} color="#FBFAF6" sw={2.2} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#FBFAF6' }}>Novo</Text>
          </Pressable>
        </View>

        <Text style={{ paddingHorizontal: 22, paddingBottom: 18, fontSize: 13, color: colors.muted }}>
          {cards.length} {cards.length === 1 ? 'cartao' : 'cartoes'} - {cards.filter((c) => c.type === 'credit').length} de credito
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
        >
          {cards.map((card, index) => {
            const active = index === activeIdx;
            return (
              <Pressable
                key={card.id}
                onPress={() => setActiveIdx(index)}
                style={{
                  width: 280,
                  minHeight: 180,
                  marginRight: 12,
                  padding: 20,
                  borderRadius: 24,
                  backgroundColor: card.gradientColors[0],
                  borderWidth: active ? 2 : 0,
                  borderColor: active ? colors.ink : 'transparent',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                      {card.bank ?? ''}
                    </Text>
                    <Text style={{ fontSize: 20, color: '#fff', fontWeight: '600', marginTop: 4 }}>
                      {card.name}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                    {card.type === 'credit' ? 'Credito' : 'Debito'}
                  </Text>
                </View>

                <View>
                  <Text style={{ fontSize: 18, color: '#fff', letterSpacing: 3 }}>**** **** **** {card.last4 ?? '----'}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{card.holder ?? 'Sem titular'}</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{card.expiry ?? '--/--'}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 22,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.hairline,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>
                  {activeCard.name}
                </Text>
              </View>
              <Pressable
                onPress={() => setIsActionsOpen(true)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  backgroundColor: 'rgba(21,21,26,0.035)',
                  borderWidth: 1,
                  borderColor: 'rgba(21,21,26,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon.More size={18} color={colors.ink} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Fatura atual</Text>
                <Text style={{ fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4 }}>
                  R$ {fmtBRLShort(activeCard.currentMonthTotal)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Limite</Text>
                <Text style={{ fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: 4 }}>
                  {activeCard.limit !== null ? `R$ ${fmtBRLShort(activeCard.limit)}` : 'Nao informado'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Melhor dia de compra</Text>
                <Text style={{ fontSize: 16, fontWeight: '500', color: colors.ink, marginTop: 4 }}>
                  {formatShortDate(activeCard.bestPurchaseDate)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Fechamento</Text>
                <Text style={{ fontSize: 16, fontWeight: '500', color: colors.ink, marginTop: 4 }}>
                  {activeCard.closingDay ?? '--'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>Vencimento</Text>
                <Text style={{ fontSize: 16, fontWeight: '500', color: colors.ink, marginTop: 4 }}>
                  {activeCard.dueDay ?? '--'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        visible={isActionsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsActionsOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => setIsActionsOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: 'rgba(21,21,26,0.28)',
            }}
          />
          <View
            style={{
              margin: 12,
              marginBottom: 24,
              borderRadius: 28,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.hairline,
              padding: 8,
              gap: 4,
            }}
          >
            <View style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: colors.hairline, alignSelf: 'center', marginVertical: 8 }} />
            <Pressable
              onPress={handleEdit}
              style={{
                height: 52,
                borderRadius: 18,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  backgroundColor: 'rgba(21,21,26,0.045)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon.Edit size={15} color={colors.ink} sw={1.7} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: colors.ink }}>Editar cartao</Text>
            </Pressable>
            <Pressable
              onPress={handleRemoveAction}
              disabled={deleteCardMutation.isPending}
              style={{
                height: 52,
                borderRadius: 18,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                gap: 12,
                opacity: deleteCardMutation.isPending ? 0.65 : 1,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  backgroundColor: 'rgba(164,62,44,0.075)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon.Trash size={15} color="#A43E2C" sw={1.7} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: '#A43E2C' }}>
                {deleteCardMutation.isPending ? 'Removendo...' : 'Remover cartao'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
