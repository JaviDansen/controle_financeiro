import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Icon } from '../../src/components/ui/Icon';
import { colors } from '../../src/theme/colors';
import { useCards } from '../../hooks/useCards';
import { useCategories, useCreateCategory } from '../../hooks/useCategories';
import { CATEGORY_ICONS, getCategoryIcon } from '../../src/lib/categoryIcons';

/* ─── Tipos ───────────────────────────────────────────────── */
type PaymentId = 'none' | 'pix' | 'transfer' | 'boleto' | string;

interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

const FALLBACK_COLOR = '#8B8B92';

/* ─── CategoryDot ─────────────────────────────────────────── */
function CategoryDot({ cat, selected, onPress }: {
  cat: Category;
  selected: boolean;
  onPress: () => void;
}) {
  const catColor = cat.color ?? FALLBACK_COLOR;
  const LucideIcon = getCategoryIcon(cat.icon);

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: selected ? catColor + '22' : colors.surface,
        borderWidth: 1.5,
        borderColor: selected ? catColor : colors.hairline,
        borderRadius: 16,
        paddingVertical: 12, paddingHorizontal: 8,
        alignItems: 'center',
        gap: 6,
      }}
    >
      <View style={{
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: selected ? catColor : catColor + '20',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <LucideIcon size={18} color={selected ? '#fff' : catColor} strokeWidth={2} />
      </View>
      <Text style={{
        fontSize: 10, fontWeight: '500', textAlign: 'center', lineHeight: 13,
        color: selected ? catColor : colors.ink2,
      }} numberOfLines={2}>
        {cat.name}
      </Text>
    </Pressable>
  );
}

/* ─── PaymentChip ─────────────────────────────────────────── */
function PaymentChip({ label, subtitle, selected, onPress, children }: {
  label: string; subtitle: string;
  selected: boolean; onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexShrink: 0,
        backgroundColor: selected ? colors.ink : colors.surface,
        borderWidth: 1.5,
        borderColor: selected ? colors.ink : colors.hairline,
        borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 10,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        minWidth: 120,
      }}
    >
      {children}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: selected ? '#FBFAF6' : colors.ink }}>
          {label}
        </Text>
        <Text style={{ fontSize: 11, color: selected ? 'rgba(251,250,246,0.6)' : colors.muted, marginTop: 1 }}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

/* ─── Step 2 ──────────────────────────────────────────────── */
export default function NewTransactionStep2() {
  const router = useRouter();
  const statusBarHeight = StatusBar.currentHeight ?? 0;
  const params = useLocalSearchParams<{
    type: string; amount: string; title: string; date: string;
  }>();

  const { data: cards = [] } = useCards();
  const creditCards = cards.filter(c => c.type === 'credit' || c.type === 'debit');

  const { data: apiCategories = [], isLoading: catsLoading } = useCategories();
  const createCategoryMutation = useCreateCategory();

  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentId>('none');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  // Modal nova categoria
  const [modalOpen, setModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedIconKey, setSelectedIconKey] = useState(CATEGORY_ICONS[0].key);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  const PALETTE = CATEGORY_ICONS.map(i => i.defaultColor);
  const selectedColor = PALETTE[selectedColorIdx % PALETTE.length];

  function handleCreateCategory() {
    const name = newCatName.trim();
    if (!name) return;
    createCategoryMutation.mutate(
      { name, color: selectedColor, icon: selectedIconKey } as any,
      {
        onSuccess: (created) => {
          setSelectedCat(created);
          setNewCatName('');
          setModalOpen(false);
        },
      }
    );
  }

  function handleNext() {
    if (!selectedCat) return;
    const cardId = selectedPayment.startsWith('c-') ? selectedPayment.slice(2) : null;
    router.push({
      pathname: '/(tabs)/new-transaction-step3',
      params: {
        ...params,
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        categoryColor: selectedCat.color ?? FALLBACK_COLOR,
        categoryIcon: selectedCat.icon ?? '',
        cardId: cardId ?? '',
        paymentType: ['pix', 'transfer', 'boleto'].includes(selectedPayment) ? selectedPayment : '',
        notes,
        isRecurring: isRecurring ? '1' : '0',
      },
    });
  }

  const canNext = !!selectedCat;

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
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16,
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
              Categoria e pagamento
            </Text>
            <View style={{ backgroundColor: colors.ink, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.surface, letterSpacing: 0.5 }}>
                2 de 3
              </Text>
            </View>
          </View>

          {/* Resumo passo 1 */}
          <View style={{
            marginHorizontal: 16, marginBottom: 20,
            backgroundColor: colors.surface,
            borderRadius: 16, borderWidth: 1, borderColor: colors.hairline,
            paddingHorizontal: 16, paddingVertical: 12,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: params.type === 'income' ? colors.pos : colors.neg,
              }} />
              <View>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {params.type === 'income' ? 'Receita' : 'Despesa'} · {params.date}
                </Text>
                <Text style={{ fontSize: 13, color: colors.ink2, marginTop: 1 }}>{params.title}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 17, fontWeight: '500', color: colors.ink, letterSpacing: -0.4 }}>
              R$ {parseFloat(params.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Categorias */}
          <Text style={{
            fontSize: 11, fontWeight: '500', color: colors.muted,
            textTransform: 'uppercase', letterSpacing: 0.8,
            marginBottom: 10, paddingHorizontal: 22,
          }}>
            Categoria
          </Text>
          <View style={{ paddingHorizontal: 16, marginBottom: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {catsLoading
              ? [1, 2, 3, 4, 5, 6].map(i => (
                  <View key={i} style={{ width: '30%', height: 82, borderRadius: 16, backgroundColor: colors.hairline }} />
                ))
              : apiCategories.map(cat => (
                  <View key={cat.id} style={{ width: '30%' }}>
                    <CategoryDot
                      cat={cat}
                      selected={selectedCat?.id === cat.id}
                      onPress={() => setSelectedCat(cat)}
                    />
                  </View>
                ))
            }

            {/* Botão + nova categoria */}
            {!catsLoading && (
              <Pressable
                onPress={() => setModalOpen(true)}
                style={{
                  width: '30%',
                  borderWidth: 1.5, borderColor: colors.hairline,
                  borderStyle: 'dashed', borderRadius: 16,
                  paddingVertical: 12, paddingHorizontal: 8,
                  alignItems: 'center', gap: 6,
                }}
              >
                <View style={{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: colors.hairline,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 22, color: colors.muted, lineHeight: 26 }}>+</Text>
                </View>
                <Text style={{ fontSize: 10, fontWeight: '500', color: colors.muted }}>Nova</Text>
              </Pressable>
            )}
          </View>

          {/* Forma de pagamento */}
          <Text style={{
            fontSize: 11, fontWeight: '500', color: colors.muted,
            textTransform: 'uppercase', letterSpacing: 0.8,
            marginBottom: 10, paddingHorizontal: 22,
          }}>
            Forma de pagamento
          </Text>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 4 }}
            style={{ marginBottom: 24 }}
          >
            <PaymentChip label="Sem pagamento" subtitle="Não vincular" selected={selectedPayment === 'none'} onPress={() => setSelectedPayment('none')}>
              <View style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, color: selectedPayment === 'none' ? '#FBFAF6' : colors.muted, lineHeight: 20 }}>×</Text>
              </View>
            </PaymentChip>

            <PaymentChip label="Pix" subtitle="Instantâneo" selected={selectedPayment === 'pix'} onPress={() => setSelectedPayment('pix')}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#32BCAD22', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#32BCAD' }}>₽</Text>
              </View>
            </PaymentChip>

            <PaymentChip label="Transferência" subtitle="TED / DOC" selected={selectedPayment === 'transfer'} onPress={() => setSelectedPayment('transfer')}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#3B5DA022', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.Tx size={15} color="#3B5DA0" sw={2} />
              </View>
            </PaymentChip>

            <PaymentChip label="Boleto" subtitle="Bancário" selected={selectedPayment === 'boleto'} onPress={() => setSelectedPayment('boleto')}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.hairline, alignItems: 'center', justifyContent: 'center' }}>
                <Icon.Filter size={14} color={colors.muted} sw={2} />
              </View>
            </PaymentChip>

            {creditCards.map(card => (
              <PaymentChip
                key={card.id}
                label={card.name}
                subtitle={card.last4 ? `•• ${card.last4}` : 'Débito'}
                selected={selectedPayment === `c-${card.id}`}
                onPress={() => setSelectedPayment(`c-${card.id}`)}
              >
                <View style={{ width: 4, height: 32, borderRadius: 999, backgroundColor: card.gradientColors[0] }} />
              </PaymentChip>
            ))}
          </ScrollView>

          {/* Notas */}
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={{
              fontSize: 11, fontWeight: '500', color: colors.muted,
              textTransform: 'uppercase', letterSpacing: 0.8,
              marginBottom: 6, paddingLeft: 4,
            }}>
              Notas (opcional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Algum detalhe adicional..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1.5, borderColor: colors.hairline,
                borderRadius: 14,
                paddingHorizontal: 16, paddingVertical: 14,
                fontSize: 15, color: colors.ink,
                textAlignVertical: 'top', minHeight: 60,
              }}
            />
          </View>

          {/* Recorrente */}
          <Pressable
            onPress={() => setIsRecurring(v => !v)}
            style={{
              marginHorizontal: 16, marginBottom: 24,
              backgroundColor: colors.surface,
              borderRadius: 14, borderWidth: 1, borderColor: colors.hairline,
              paddingHorizontal: 16, paddingVertical: 14,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>Transação recorrente</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>Repetição mensal automática</Text>
            </View>
            <View style={{
              width: 44, height: 26, borderRadius: 13,
              backgroundColor: isRecurring ? colors.pos : colors.hairline,
              justifyContent: 'center', paddingHorizontal: 3,
            }}>
              <View style={{
                width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
                transform: [{ translateX: isRecurring ? 18 : 0 }],
                shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
              }} />
            </View>
          </Pressable>

          {/* Botão próximo */}
          <Pressable
            onPress={handleNext}
            disabled={!canNext}
            style={{
              marginHorizontal: 16,
              backgroundColor: canNext ? colors.ink : colors.hairline,
              borderRadius: 18, paddingVertical: 16,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '500', color: canNext ? colors.surface : colors.muted }}>
              Revisar e salvar
            </Text>
            <Icon.ChevR size={16} color={canNext ? colors.surface : colors.muted} sw={2.5} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal nova categoria */}
      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(21,21,26,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setModalOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              padding: 24, paddingBottom: 36,
            }}
            onPress={() => {}}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: 'center', marginBottom: 20 }} />

            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, marginBottom: 16 }}>
              Nova categoria
            </Text>

            {/* Nome */}
            <TextInput
              value={newCatName}
              onChangeText={setNewCatName}
              placeholder="Nome da categoria..."
              placeholderTextColor={colors.muted}
              autoFocus
              style={{
                backgroundColor: colors.bg,
                borderWidth: 1.5, borderColor: newCatName ? colors.ink : colors.hairline,
                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                fontSize: 15, color: colors.ink, marginBottom: 16,
              }}
            />

            {/* Preview */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: colors.bg, borderRadius: 14, padding: 14, marginBottom: 16,
            }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: selectedColor,
                alignItems: 'center', justifyContent: 'center',
              }}>
                {(() => {
                  const IC = getCategoryIcon(selectedIconKey);
                  return <IC size={20} color="#fff" strokeWidth={2} />;
                })()}
              </View>
              <View>
                <Text style={{ fontSize: 13, color: colors.muted }}>Prévia</Text>
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.ink }}>
                  {newCatName || 'Nome da categoria'}
                </Text>
              </View>
            </View>

            {/* Seleção de ícone */}
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Ícone
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {CATEGORY_ICONS.map(iconDef => {
                const IC = iconDef.component;
                const active = selectedIconKey === iconDef.key;
                return (
                  <Pressable
                    key={iconDef.key}
                    onPress={() => setSelectedIconKey(iconDef.key)}
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      backgroundColor: active ? selectedColor : colors.bg,
                      borderWidth: 1.5, borderColor: active ? selectedColor : colors.hairline,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <IC size={18} color={active ? '#fff' : colors.muted} strokeWidth={2} />
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Seleção de cor */}
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Cor
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {PALETTE.map((c, idx) => (
                <Pressable
                  key={c + idx}
                  onPress={() => setSelectedColorIdx(idx)}
                  style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: c,
                    borderWidth: selectedColorIdx === idx ? 2.5 : 0,
                    borderColor: '#fff',
                    shadowColor: selectedColorIdx === idx ? c : 'transparent',
                    shadowOpacity: 0.6, shadowRadius: 6, elevation: selectedColorIdx === idx ? 4 : 0,
                  }}
                />
              ))}
            </ScrollView>

            {/* Ações */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => { setModalOpen(false); setNewCatName(''); }}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 14,
                  borderWidth: 1.5, borderColor: colors.hairline, alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.muted }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateCategory}
                disabled={createCategoryMutation.isPending || !newCatName.trim()}
                style={{
                  flex: 2, paddingVertical: 14, borderRadius: 14,
                  backgroundColor: newCatName.trim() ? colors.ink : colors.hairline,
                  alignItems: 'center',
                  opacity: createCategoryMutation.isPending ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: newCatName.trim() ? colors.surface : colors.muted }}>
                  {createCategoryMutation.isPending ? 'Criando...' : 'Criar categoria'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
