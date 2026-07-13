import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '../../src/components/ui/Icon';
import { CalendarPicker, MONTHS_SHORT } from '../../src/components/ui/CalendarPicker';
import { colors } from '../../src/theme/colors';
import { useAuthStore } from '../../store/auth.store';
import { queryKeys } from '../../src/lib/queryKeys';
import {
  extractFile,
  extractByImageId,
  confirmImport,
  getImportGallery,
  deleteImage,
  DuplicateImageError,
  type ExtractUploadPayload,
  type ExtractedTransaction,
  type ConfirmItem,
  type GalleryItem,
  type ImportFormat,
} from '../../services/import.service';
import { getCategories, createCategory, type Category } from '../../services/categories.service';

// ── Constantes ─────────────────────────────────────────────────────────────

const BANKS = [{ id: 'mercadopago', label: 'Mercado Pago' }] as const
const DOCUMENT_TYPES = [
  'application/pdf', 'text/csv', 'application/csv',
  'text/comma-separated-values', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
const GALLERY_DOWNLOAD_CONCURRENCY = 4

type BankId = typeof BANKS[number]['id']

type ExtractResult =
  | { status: 'success'; imageId: string; transactions: ExtractedTransaction[] }
  | { status: 'error'; fileName: string; message?: string }
  | { status: 'duplicate'; fileName: string; imageId: string }

// Cada transação recebe uma chave estável de UI, já que `extractedId` pode ser
// nulo em resultados recém-extraídos que ainda não foram persistidos.
type RowTransaction = ExtractedTransaction & { rowKey: string }

// ── Helpers ─────────────────────────────────────────────────────────────────

function prevMonth(month: number, year: number) {
  return month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year }
}
function nextMonth(month: number, year: number) {
  return month === 11 ? { month: 0, year: year + 1 } : { month: month + 1, year }
}

function dedupeKey(t: ExtractedTransaction) {
  return `${t.title.toLowerCase()}|${t.amount}|${t.date}|${t.type}`
}

let rowKeySeq = 0
function nextRowKey(t: ExtractedTransaction) {
  return t.extractedId ?? `tmp-${Date.now()}-${rowKeySeq++}`
}

// Mescla transações novas com as já pendentes, deduplicando por conteúdo e
// preservando a rowKey estável de itens já existentes (necessária para o
// estado de categorias sobreviver a essa mesclagem).
function mergeTransactions(prev: RowTransaction[], incoming: ExtractedTransaction[]): RowTransaction[] {
  const byDedupeKey = new Map(prev.map(t => [dedupeKey(t), t]))
  for (const t of incoming) {
    const key = dedupeKey(t)
    if (!byDedupeKey.has(key)) {
      byDedupeKey.set(key, { ...t, rowKey: nextRowKey(t) })
    }
  }
  return Array.from(byDedupeKey.values())
}

function toIso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
function inferFormat(fileName?: string | null, mimeType?: string | null): ImportFormat | null {
  const ext = fileName?.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return 'csv'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'xls') return 'xls'
  if (ext === 'xlsx') return 'xlsx'
  if (mimeType?.startsWith('image/')) return 'screenshot'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType?.includes('spreadsheetml')) return 'xlsx'
  if (mimeType?.includes('csv')) return 'csv'
  if (mimeType === 'application/vnd.ms-excel') return 'xls'
  return null
}
function formatAmount(amount: number | string, type: 'income' | 'expense') {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  const formatted = n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return type === 'income' ? `+R$ ${formatted}` : `-R$ ${formatted}`
}
function formatDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${parseInt(d)} ${MONTHS_SHORT[parseInt(m) - 1]}`
}
function bankLabel(bank: string) {
  return bank === 'mercadopago' ? 'Mercado Pago' : bank
}
async function fetchAuthImage(imageId: string, token: string, fileName?: string): Promise<string> {
  const extension = fileName?.split('.').pop()?.toLowerCase() ?? 'jpg'
  const localUri = `${FileSystem.cacheDirectory}import_${imageId}.${extension}`
  const info = await FileSystem.getInfoAsync(localUri)
  if (info.exists) return localUri
  const { uri } = await FileSystem.downloadAsync(
    `${API_URL}/import/image/${imageId}`,
    localUri,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return uri
}

// Baixa imagens da galeria com concorrência limitada (evita disparar N downloads
// simultâneos quando a pasta tem dezenas de arquivos) e atualiza uma imagem por vez,
// isolado do restante da tela via componente próprio (ver GalleryThumb).
function useGalleryUris(items: GalleryItem[] | undefined, token: string | null) {
  const [uris, setUris] = useState<Record<string, string>>({})
  const inFlightRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!items || !token) return
    const authToken = token
    let cancelled = false
    const queue = items.filter(item => !uris[item.imageId] && !inFlightRef.current.has(item.imageId))

    async function worker() {
      while (queue.length > 0) {
        const item = queue.shift()
        if (!item) return
        inFlightRef.current.add(item.imageId)
        try {
          const uri = await fetchAuthImage(item.imageId, authToken, item.fileName)
          if (!cancelled) setUris(prev => (prev[item.imageId] ? prev : { ...prev, [item.imageId]: uri }))
        } catch {
          // erro isolado nesta imagem não interrompe as demais
        } finally {
          inFlightRef.current.delete(item.imageId)
        }
      }
    }

    const workers = Array.from({ length: GALLERY_DOWNLOAD_CONCURRENCY }, () => worker())
    Promise.all(workers).catch(() => {})

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, token])

  return uris
}

// ── Seletor de categoria ─────────────────────────────────────────────────────

const PRESET_COLORS = ['#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#10B981', '#F97316', '#22C55E', '#6B7280', '#EC4899', '#14B8A6']

const CategoryPicker = React.memo(function CategoryPicker({
  visible, categories, token, onSelect, onClose, onCreated,
}: {
  visible: boolean
  categories: Category[]
  token: string
  onSelect: (id: string) => void
  onClose: () => void
  onCreated: () => void
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function resetForm() {
    setCreating(false)
    setNewName('')
    setNewColor(PRESET_COLORS[0])
    setError('')
  }

  async function handleCreate() {
    if (!newName.trim()) { setError('Informe um nome'); return }
    setSaving(true)
    setError('')
    try {
      const cat = await createCategory({ name: newName.trim(), color: newColor }, token)
      onCreated()
      resetForm()
      onSelect(cat.id)
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Erro ao criar categoria')
    } finally {
      setSaving(false)
    }
  }

  // Não monta a lista/form pesado enquanto o modal está fechado.
  if (!visible) return null

  const showForm = creating || categories.length === 0

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { resetForm(); onClose() }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(21,21,26,0.5)', justifyContent: 'flex-end' }} onPress={() => { resetForm(); onClose() }}>
        <Pressable onPress={e => e.stopPropagation()}>
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: 40 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: 'center', marginBottom: 20 }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink, letterSpacing: -0.3 }}>
                {showForm ? 'Nova categoria' : 'Escolher categoria'}
              </Text>
              {showForm && categories.length > 0 && (
                <Pressable onPress={resetForm}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>Cancelar</Text>
                </Pressable>
              )}
            </View>

            {/* Formulário de nova categoria */}
            {showForm && (
              <View style={{ paddingHorizontal: 20, gap: 14, marginBottom: 8 }}>
                <TextInput
                  placeholder="Nome da categoria"
                  placeholderTextColor={colors.muted}
                  value={newName}
                  onChangeText={t => { setNewName(t); setError('') }}
                  style={{ height: 44, borderWidth: 1, borderColor: error ? colors.neg : colors.hairline, borderRadius: 10, paddingHorizontal: 14, fontSize: 14, color: colors.ink, backgroundColor: colors.surface }}
                  autoFocus
                />
                {!!error && <Text style={{ fontSize: 12, color: colors.neg, marginTop: -8 }}>{error}</Text>}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {PRESET_COLORS.map(c => (
                    <Pressable
                      key={c}
                      onPress={() => setNewColor(c)}
                      style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: newColor === c ? 2.5 : 0, borderColor: colors.ink }}
                    />
                  ))}
                </View>
                <Pressable
                  onPress={handleCreate}
                  disabled={saving}
                  style={{ height: 44, borderRadius: 10, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}
                >
                  {saving
                    ? <ActivityIndicator color={colors.bg} size="small" />
                    : <Text style={{ fontSize: 14, fontWeight: '600', color: colors.bg }}>Criar categoria</Text>
                  }
                </Pressable>
              </View>
            )}

            {/* Lista de categorias existentes */}
            {!showForm && (
              <>
                {categories.map(cat => (
                  <Pressable
                    key={cat.id}
                    onPress={() => { onSelect(cat.id); onClose() }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.hairline }}
                  >
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cat.color ?? colors.muted }} />
                    <Text style={{ fontSize: 14, color: colors.ink }}>{cat.name}</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setCreating(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.hairline }}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: colors.muted, borderStyle: 'dashed' }} />
                  <Text style={{ fontSize: 14, color: colors.muted }}>Nova categoria</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
})

// ── Linha de transação ───────────────────────────────────────────────────────

const TransactionRow = React.memo(function TransactionRow({
  transaction,
  isFirst,
  isLast,
  categoryId,
  categories,
  onCategoryPress,
  onDelete,
}: {
  transaction: RowTransaction
  isFirst: boolean
  isLast: boolean
  categoryId?: string
  categories: Category[]
  onCategoryPress: () => void
  onDelete: () => void
}) {
  const cat = categories.find(c => c.id === categoryId)
  const catLabel = cat?.name
  const catColor = cat?.color ?? undefined

  return (
    <View style={{
      marginHorizontal: 16,
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.hairline,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
      borderTopLeftRadius: isFirst ? 16 : 0,
      borderTopRightRadius: isFirst ? 16 : 0,
      borderBottomLeftRadius: isLast ? 16 : 0,
      borderBottomRightRadius: isLast ? 16 : 0,
      marginTop: isFirst ? 0 : -1,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }} numberOfLines={1}>{transaction.title}</Text>
            {transaction.date_inferred && (
              <View style={{ paddingHorizontal: 5, paddingVertical: 1, backgroundColor: '#F5F0DC', borderRadius: 4 }}>
                <Text style={{ fontSize: 9, color: '#9A8030', fontWeight: '600' }}>DATA?</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>
            {transaction.description}{transaction.payment_method ? ` · ${transaction.payment_method}` : ''}
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>{formatDate(transaction.date)} · {transaction.time}</Text>

          {/* Categoria + botão excluir na mesma linha */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Pressable
              onPress={onCategoryPress}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: catColor ?? colors.hairline, backgroundColor: catColor ? `${catColor}18` : colors.hairline }}
            >
              {catColor && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: catColor }} />}
              <Text style={{ fontSize: 11, fontWeight: '500', color: catColor ?? colors.muted }}>
                {catLabel ?? 'Categoria'}
              </Text>
              <Icon.ChevR size={9} color={catColor ?? colors.muted} sw={2.5} />
            </Pressable>

            <Pressable
              onPress={onDelete}
              hitSlop={8}
              style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: colors.negSoft, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon.Trash size={12} color={colors.neg} sw={1.8} />
            </Pressable>
          </View>
        </View>

        <Text style={{ fontSize: 15, fontWeight: '600', color: transaction.type === 'income' ? colors.pos : colors.neg, marginLeft: 8, marginTop: 2 }}>
          {formatAmount(transaction.amount, transaction.type)}
        </Text>
      </View>
    </View>
  )
})

// ── Miniatura da galeria (isolada para não travar a tela enquanto baixa) ────

const GalleryThumb = React.memo(function GalleryThumb({
  item, uri, isSelected, hasSelection, onPress, onLongPress,
}: {
  item: GalleryItem
  uri: string | undefined
  isSelected: boolean
  hasSelection: boolean
  onPress: () => void
  onLongPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', borderWidth: isSelected ? 2.5 : 1, borderColor: isSelected ? colors.ink : colors.hairline, backgroundColor: colors.surface }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.muted} />
        </View>
      )}
      {isSelected && (
        <View style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.Check size={11} color="#FBFAF6" sw={2.8} />
        </View>
      )}
    </Pressable>
  )
})

// ── Modal da galeria ─────────────────────────────────────────────────────────

function GalleryItemModal({
  item, visible, selectedBank, token, onClose, onExtract, isExtracting,
}: {
  item: GalleryItem | null; visible: boolean; selectedBank: BankId
  token: string | null; onClose: () => void
  onExtract: (imageId: string, bank: BankId, date: string) => void
  isExtracting: boolean
}) {
  const now = new Date()
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [selectedDay, setSelectedDay] = useState(now.getDate())
  const [imgUri, setImgUri] = useState<string | null>(null)
  const [viewerVisible, setViewerVisible] = useState(false)
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  useEffect(() => {
    if (!item || !token || !visible) return
    setImgUri(null)
    fetchAuthImage(item.imageId, token, item.fileName)
      .then(uri => setImgUri(uri))
      .catch(() => setImgUri(null))
  }, [item?.imageId, token, visible])

  useEffect(() => {
    setViewerVisible(false)
    if (visible) {
      const d = new Date()
      setCalMonth(d.getMonth()); setCalYear(d.getFullYear()); setSelectedDay(d.getDate())
    }
  }, [visible])

  // Não monta o conteúdo pesado do modal (imagem, calendário) enquanto fechado.
  if (!visible || !item) return null

  const dateParam = toIso(calYear, calMonth, selectedDay)

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(21,21,26,0.5)', justifyContent: 'flex-end' }} onPress={onClose}>
          <Pressable onPress={e => e.stopPropagation()}>
            <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: 40 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: 'center', marginBottom: 20 }} />
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ paddingHorizontal: 20, gap: 20, paddingBottom: 8 }}>
                  <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.hairline, height: 160, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                    {imgUri ? (
                      <Pressable onPress={() => setViewerVisible(true)} style={{ width: '100%', height: '100%' }}>
                        <Image source={{ uri: imgUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                        <View style={{ position: 'absolute', right: 10, bottom: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(21,21,26,0.72)' }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#FBFAF6' }}>Toque para ampliar</Text>
                        </View>
                      </Pressable>
                    ) : (
                      <ActivityIndicator size="small" color={colors.muted} />
                    )}
                  </View>

                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Banco selecionado</Text>
                    <View style={{ padding: 14, borderRadius: 14, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#FBFAF6' }}>{bankLabel(selectedBank)}</Text>
                      <Icon.Check size={14} color="#FBFAF6" sw={2.5} />
                    </View>
                  </View>

                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Data do extrato</Text>
                    <CalendarPicker
                      year={calYear} month={calMonth} selectedDay={selectedDay}
                      onPrevMonth={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1); setSelectedDay(1) }}
                      onNextMonth={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1); setSelectedDay(1) }}
                      onSelectDay={setSelectedDay}
                    />
                  </View>

                  <Pressable onPress={() => onExtract(item.imageId, selectedBank, dateParam)} disabled={isExtracting} style={{ borderRadius: 18, paddingVertical: 16, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {isExtracting ? <ActivityIndicator size="small" color="#FBFAF6" /> : <Icon.ArrowDn size={16} color="#FBFAF6" sw={2} />}
                    <Text style={{ fontSize: 15, fontWeight: '500', color: '#FBFAF6' }}>
                      {isExtracting ? 'Extraindo transações...' : 'Extrair transações'}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={viewerVisible && !!imgUri} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(7,7,10,0.96)' }}>
          <StatusBar barStyle="light-content" />
          <Pressable onPress={() => setViewerVisible(false)} style={{ position: 'absolute', top: (StatusBar.currentHeight ?? 0) + 16, right: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <Icon.X size={18} color="#FBFAF6" sw={2.4} />
          </Pressable>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }} maximumZoomScale={4} minimumZoomScale={1} bouncesZoom centerContent pinchGestureEnabled>
            {imgUri ? <Image source={{ uri: imgUri }} style={{ width: screenWidth, height: screenHeight * 0.82 }} resizeMode="contain" /> : null}
          </ScrollView>
          <View style={{ paddingBottom: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: 'rgba(251,250,246,0.78)' }}>Use dois dedos para ampliar e arrastar</Text>
          </View>
        </View>
      </Modal>
    </>
  )
}

// ── Tela principal ───────────────────────────────────────────────────────────

export default function ImportExtractScreen() {
  const router = useRouter()
  const token = useAuthStore(s => s.token)
  const queryClient = useQueryClient()
  const statusBarHeight = StatusBar.currentHeight ?? 0

  // Banco
  const [selectedBank, setSelectedBank] = useState<BankId>('mercadopago')

  // Calendário
  const now = new Date()
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [selectedDay, setSelectedDay] = useState(now.getDate())
  const selectedDate = toIso(calYear, calMonth, selectedDay)

  // Uploads e resultados
  const [uploads, setUploads] = useState<ExtractUploadPayload[]>([])
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [extractResults, setExtractResults] = useState<ExtractResult[] | null>(null)

  // Lista acumulada de transações pendentes (uploads + reanálises da galeria, deduplicadas)
  const [pendingTransactions, setPendingTransactions] = useState<RowTransaction[]>([])
  const [hasResults, setHasResults] = useState(false)

  // Keywords de filtro
  const [ignoreKeywords, setIgnoreKeywords] = useState('reserva, guardar ao gastar')

  // Categorias por rowKey estável da transação (não por índice — sobrevive a exclusões/reordenações)
  const [txCategories, setTxCategories] = useState<Record<string, string>>({})

  // Picker de categoria aberto para qual rowKey
  const [categoryPickerKey, setCategoryPickerKey] = useState<string | null>(null)

  // Modal de confirmação
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)

  // Galeria — seleção individual e múltipla
  const [galleryModalItem, setGalleryModalItem] = useState<GalleryItem | null>(null)
  const [gallerySelected, setGallerySelected] = useState<Set<string>>(new Set())
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [batchCalMonth, setBatchCalMonth] = useState(now.getMonth())
  const [batchCalYear, setBatchCalYear] = useState(now.getFullYear())
  const [batchCalDay, setBatchCalDay] = useState(now.getDate())

  const galleryQuery = useQuery({
    queryKey: queryKeys.importGallery(),
    queryFn: () => getImportGallery(token!),
    enabled: !!token,
  })
  const galleryUris = useGalleryUris(galleryQuery.data, token)

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => getCategories(token!),
    enabled: !!token,
  })
  const categories = categoriesQuery.data ?? []

  const toggleGallerySelect = useCallback((imageId: string) => {
    setGallerySelected(prev => {
      const next = new Set(prev)
      next.has(imageId) ? next.delete(imageId) : next.add(imageId)
      return next
    })
  }, [])

  const galleryExtractMutation = useMutation({
    mutationFn: ({ imageId, bank, date }: { imageId: string; bank: BankId; date: string }) =>
      extractByImageId(imageId, bank, token!, date),
    onSuccess: (res) => {
      addTransactions(res.transactions)
      setGalleryModalItem(null)
    },
  })

  const deleteImagesMutation = useMutation({
    mutationFn: async (imageIds: string[]) => {
      if (!token) throw new Error('Não autenticado')
      for (const imageId of imageIds) {
        await deleteImage(imageId, token)
      }
    },
    onSuccess: () => {
      setGallerySelected(new Set())
      queryClient.invalidateQueries({ queryKey: queryKeys.importGallery() })
    },
    onError: (err) => {
      console.error('[delete] erro ao excluir imagem:', err)
    },
  })

  const batchExtractMutation = useMutation({
    mutationFn: async ({ imageIds, bank, date }: { imageIds: string[]; bank: BankId; date: string }) => {
      const all: ExtractedTransaction[] = []
      for (const imageId of imageIds) {
        const res = await extractByImageId(imageId, bank, token!, date)
        all.push(...res.transactions.filter(t => !t.skipped))
      }
      return all
    },
    onSuccess: (transactions) => {
      addTransactions(transactions)
      setGallerySelected(new Set())
      setBatchModalVisible(false)
    },
  })

  const confirmMutation = useMutation({
    mutationFn: (items: ConfirmItem[]) => confirmImport(items, token!),
    onSuccess: () => {
      setConfirmModalVisible(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() })
      resetAll()
    },
  })

  function addTransactions(incoming: ExtractedTransaction[]) {
    const keywords = ignoreKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    const filtered = incoming.filter(t => !t.skipped && !keywords.some(k => t.title.toLowerCase().includes(k)))
    setPendingTransactions(prev => mergeTransactions(prev, filtered))
    setHasResults(true)
  }

  function resetAll() {
    setUploads([])
    setExtractResults(null)
    setSelectionError(null)
    setTxCategories({})
    setCategoryPickerKey(null)
    setConfirmModalVisible(false)
    setPendingTransactions([])
    setHasResults(false)
    extractMutation.reset()
  }

  function addUploads(items: ExtractUploadPayload[]) {
    setUploads(prev => [...prev, ...items])
    setSelectionError(null)
    extractMutation.reset()
  }

  function removeUpload(index: number) {
    setUploads(prev => prev.filter((_, i) => i !== index))
    setExtractResults(null)
    extractMutation.reset()
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) { setSelectionError('Permita acesso à galeria para selecionar imagens.'); return }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.8, allowsMultipleSelection: true })
    if (picked.canceled) return
    const valid: ExtractUploadPayload[] = picked.assets.filter(a => a.base64).map(a => ({
      fileBase64: a.base64!, fileName: a.fileName ?? 'imagem.jpg', format: 'screenshot' as const, mimeType: a.mimeType,
    }))
    if (!valid.length) { setSelectionError('Não foi possível ler as imagens.'); return }
    addUploads(valid)
  }

  async function pickDocument() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: DOCUMENT_TYPES, copyToCacheDirectory: true, multiple: true })
      if (picked.canceled || !picked.assets?.length) return
      const valid: ExtractUploadPayload[] = []
      for (const asset of picked.assets) {
        const format = inferFormat(asset.name, asset.mimeType)
        if (!format) continue
        const fileBase64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 })
        valid.push({ fileBase64, fileName: asset.name, format, mimeType: asset.mimeType })
      }
      if (!valid.length) { setSelectionError('Formato não suportado. Use PDF, CSV, XLS ou XLSX.'); return }
      addUploads(valid)
    } catch { setSelectionError('Não foi possível ler o arquivo.') }
  }

  // Extração direta — sem etapa de validação
  const extractMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Não autenticado')
      const sessionToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const results: ExtractResult[] = []

      for (const upload of uploads) {
        try {
          const res = await extractFile(upload, selectedBank, token, selectedDate, sessionToken)
          results.push({ status: 'success', imageId: res.imageId, transactions: res.transactions })
        } catch (err) {
          if (err instanceof DuplicateImageError) {
            results.push({ status: 'duplicate', fileName: upload.fileName, imageId: err.imageId! })
          } else {
            results.push({ status: 'error', fileName: upload.fileName, message: err instanceof Error ? err.message : undefined })
          }
        }
      }
      return results
    },
    onSuccess: (results) => {
      setExtractResults(results)
      const newTxs = results.flatMap(r => r.status === 'success' ? r.transactions : [])
      addTransactions(newTxs)
      queryClient.invalidateQueries({ queryKey: queryKeys.importGallery() })
    },
  })

  const activeTransactions = pendingTransactions
  const showResults = hasResults

  const skippedCount = (extractResults ?? [])
    .flatMap(r => r.status === 'success' ? r.transactions : [])
    .filter(t => t.skipped).length

  // Saldo projetado no modal de confirmação
  const projectedDelta = activeTransactions.reduce((acc, t) => {
    const v = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount
    return acc + (t.type === 'income' ? v : -v)
  }, 0)

  const handleDeleteRow = useCallback((rowKey: string) => {
    setPendingTransactions(prev => prev.filter(t => t.rowKey !== rowKey))
    setTxCategories(prev => {
      if (!(rowKey in prev)) return prev
      const { [rowKey]: _removed, ...rest } = prev
      return rest
    })
  }, [])

  const handleCategoryPress = useCallback((rowKey: string) => {
    setCategoryPickerKey(rowKey)
  }, [])

  const renderTransactionRow = useCallback(({ item, index }: { item: RowTransaction; index: number }) => (
    <TransactionRow
      transaction={item}
      isFirst={index === 0}
      isLast={index === activeTransactions.length - 1}
      categoryId={txCategories[item.rowKey]}
      categories={categories}
      onCategoryPress={() => handleCategoryPress(item.rowKey)}
      onDelete={() => handleDeleteRow(item.rowKey)}
    />
  ), [activeTransactions.length, txCategories, categories, handleCategoryPress, handleDeleteRow])

  const keyExtractorRow = useCallback((item: RowTransaction) => item.rowKey, [])

  // ── Header: tudo que vem antes da lista de transações ──────────────────────
  const ListHeader = useMemo(() => (
    <View>
      {/* Header da tela */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 20 }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' }}>
          <Icon.ChevL size={16} color={colors.ink} sw={2.5} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '500', color: colors.ink, letterSpacing: -0.3 }}>Importar extrato</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>Envie imagem, PDF ou planilha do seu banco</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ paddingHorizontal: 16, gap: 20 }}>

        {/* Banco */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 }}>Banco</Text>
          {BANKS.map(bank => {
            const active = selectedBank === bank.id
            return (
              <Pressable key={bank.id} onPress={() => setSelectedBank(bank.id)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: active ? colors.ink : colors.hairline, backgroundColor: active ? colors.ink : colors.surface }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: active ? '#FBFAF6' : colors.ink }}>{bank.label}</Text>
                {active && <Icon.Check size={14} color="#FBFAF6" sw={2.5} />}
              </Pressable>
            )
          })}
        </View>

        {/* Data de referência */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingLeft: 4 }}>Data de referência</Text>
          <CalendarPicker
            year={calYear} month={calMonth} selectedDay={selectedDay}
            onPrevMonth={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1); setSelectedDay(1) }}
            onNextMonth={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1); setSelectedDay(1) }}
            onSelectDay={setSelectedDay}
          />
        </View>

        {/* Filtro de keywords */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 }}>Ignorar movimentações internas</Text>
          <TextInput
            value={ignoreKeywords}
            onChangeText={setIgnoreKeywords}
            placeholder="reserva, guardar ao gastar"
            placeholderTextColor={colors.muted}
            style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface, fontSize: 13, color: colors.ink }}
          />
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 6, paddingLeft: 4 }}>Transações cujo título contenha essas palavras serão ocultadas</Text>
        </View>

        {/* Arquivos */}
        <View>
          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 }}>Enviar novo arquivo</Text>

          {uploads.length > 0 && (
            <View style={{ gap: 8, marginBottom: 10 }}>
              {uploads.map((upload, index) => {
                const result = extractResults?.[index]
                const isDuplicate = result?.status === 'duplicate'
                const isError = result?.status === 'error'
                const isSuccess = result?.status === 'success'
                return (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: isSuccess ? colors.accent : isError || isDuplicate ? colors.neg : colors.hairline, backgroundColor: isSuccess ? colors.accentSoft : isError || isDuplicate ? colors.negSoft : colors.surface, gap: 10 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: isSuccess ? colors.accent : isError || isDuplicate ? colors.neg : colors.hairline, alignItems: 'center', justifyContent: 'center' }}>
                      {isSuccess ? <Icon.Check size={14} color="#fff" sw={2.5} /> : isError || isDuplicate ? <Icon.X size={14} color="#fff" sw={2.5} /> : <Icon.Upload size={14} color={colors.muted} sw={1.8} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }} numberOfLines={1}>{upload.fileName}</Text>
                      {isDuplicate && <Text style={{ fontSize: 11, color: colors.neg, marginTop: 1 }}>Imagem já enviada anteriormente</Text>}
                      {isError && <Text style={{ fontSize: 11, color: colors.neg, marginTop: 1 }}>{result.message ?? 'Erro ao processar'}</Text>}
                      {isSuccess && <Text style={{ fontSize: 11, color: colors.accent, marginTop: 1 }}>{result.transactions.filter(t => !t.skipped).length} transações encontradas</Text>}
                      {!result && <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>{upload.format.toUpperCase()}</Text>}
                    </View>
                    {!extractMutation.isPending && !result && (
                      <Pressable onPress={() => removeUpload(index)} hitSlop={8} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.hairline, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon.X size={12} color={colors.muted} sw={2} />
                      </Pressable>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {!extractResults && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <Pressable onPress={pickImage} style={{ flex: 1, borderRadius: 14, paddingVertical: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }}>+ Imagens</Text>
              </Pressable>
              <Pressable onPress={pickDocument} style={{ flex: 1, borderRadius: 14, paddingVertical: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }}>+ Arquivo</Text>
              </Pressable>
            </View>
          )}

          {uploads.length === 0 && (
            <View style={{ borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.hairline, backgroundColor: colors.surface, padding: 24, alignItems: 'center', gap: 10 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.hairline, alignItems: 'center', justifyContent: 'center' }}>
                <Icon.Upload size={22} color={colors.muted} sw={1.8} />
              </View>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>Nenhum arquivo selecionado</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>Aceita imagens, PDF, CSV, XLS e XLSX</Text>
              </View>
            </View>
          )}
        </View>

        {selectionError && <Text style={{ fontSize: 13, color: colors.neg, textAlign: 'center' }}>{selectionError}</Text>}

        {/* Botão principal */}
        {!extractResults && (
          <Pressable
            onPress={() => extractMutation.mutate()}
            disabled={uploads.length === 0 || extractMutation.isPending}
            style={{ borderRadius: 18, paddingVertical: 16, backgroundColor: uploads.length > 0 ? colors.ink : colors.hairline, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {extractMutation.isPending ? <ActivityIndicator size="small" color="#FBFAF6" /> : <Icon.ArrowDn size={16} color={uploads.length > 0 ? '#FBFAF6' : colors.muted} sw={2} />}
            <Text style={{ fontSize: 15, fontWeight: '500', color: uploads.length > 0 ? '#FBFAF6' : colors.muted }}>
              {extractMutation.isPending ? 'Extraindo transações...' : 'Extrair transações'}
            </Text>
          </Pressable>
        )}

        {showResults && activeTransactions.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Transações encontradas</Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              {activeTransactions.length}{skippedCount > 0 ? ` · ${skippedCount} ignoradas` : ''}
            </Text>
          </View>
        )}

        {showResults && activeTransactions.length === 0 && (
          <View style={{ borderRadius: 16, padding: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>Nenhuma transação encontrada</Text>
            <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>Verifique se a imagem mostra a lista de atividades com datas visíveis.</Text>
          </View>
        )}
      </View>
    </View>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [
    selectedBank, calYear, calMonth, selectedDay, ignoreKeywords, uploads, extractResults,
    selectionError, extractMutation.isPending, extractMutation.mutate, showResults,
    activeTransactions.length, skippedCount,
  ])

  // ── Footer: ações finais + galeria de imagens ───────────────────────────────
  const ListFooter = useMemo(() => (
    <View style={{ paddingHorizontal: 16, gap: 20, paddingBottom: 40 }}>
      {showResults && activeTransactions.length > 0 && (
        <Pressable
          onPress={() => setConfirmModalVisible(true)}
          style={{ borderRadius: 18, paddingVertical: 16, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Icon.Check size={16} color="#FBFAF6" sw={2.5} />
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#FBFAF6' }}>Confirmar transações</Text>
        </Pressable>
      )}

      {showResults && (
        <Pressable onPress={resetAll} style={{ borderRadius: 18, paddingVertical: 14, borderWidth: 1.5, borderColor: colors.hairline, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.muted }}>Analisar outras imagens</Text>
        </Pressable>
      )}

      {/* Galeria */}
      <View style={{ marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingLeft: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Imagens disponíveis</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {galleryQuery.isFetching && <ActivityIndicator size="small" color={colors.muted} />}
            {gallerySelected.size > 0 && (
              <Pressable onPress={() => setGallerySelected(new Set())} hitSlop={8}>
                <Text style={{ fontSize: 12, color: colors.muted }}>Limpar</Text>
              </Pressable>
            )}
          </View>
        </View>

        {galleryQuery.data && galleryQuery.data.length === 0 && (
          <View style={{ borderRadius: 16, padding: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.hairline, backgroundColor: colors.surface, alignItems: 'center', gap: 6 }}>
            <Icon.Image size={22} color={colors.muted} sw={1.6} />
            <Text style={{ fontSize: 13, color: colors.muted }}>Nenhuma imagem na pasta</Text>
          </View>
        )}

        {galleryQuery.data && galleryQuery.data.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {galleryQuery.data.map((item) => {
              const isSelected = gallerySelected.has(item.imageId)
              return (
                <GalleryThumb
                  key={item.imageId}
                  item={item}
                  uri={galleryUris[item.imageId]}
                  isSelected={isSelected}
                  hasSelection={gallerySelected.size > 0}
                  onPress={() => {
                    if (gallerySelected.size > 0) {
                      toggleGallerySelect(item.imageId)
                    } else {
                      setGalleryModalItem(item)
                    }
                  }}
                  onLongPress={() => toggleGallerySelect(item.imageId)}
                />
              )
            })}
          </View>
        )}

        {gallerySelected.size > 0 && (
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => setBatchModalVisible(true)}
              disabled={batchExtractMutation.isPending || deleteImagesMutation.isPending}
              style={{ flex: 1, borderRadius: 18, paddingVertical: 14, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Icon.ArrowDn size={15} color="#FBFAF6" sw={2} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#FBFAF6' }}>
                Reanalisar {gallerySelected.size}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => deleteImagesMutation.mutate(Array.from(gallerySelected))}
              disabled={deleteImagesMutation.isPending || batchExtractMutation.isPending}
              style={{ borderRadius: 18, paddingVertical: 14, paddingHorizontal: 18, backgroundColor: colors.negSoft, borderWidth: 1, borderColor: colors.neg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {deleteImagesMutation.isPending
                ? <ActivityIndicator size="small" color={colors.neg} />
                : <Icon.Trash size={15} color={colors.neg} sw={1.8} />}
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.neg }}>
                Excluir
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [
    showResults, activeTransactions.length, galleryQuery.data, galleryQuery.isFetching,
    galleryUris, gallerySelected, batchExtractMutation.isPending, deleteImagesMutation.isPending,
    toggleGallerySelect,
  ])

  const categoryPickerCategories = categories

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: statusBarHeight }}>
      <FlatList
        data={activeTransactions}
        renderItem={renderTransactionRow}
        keyExtractor={keyExtractorRow}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      {/* Picker de categoria */}
      <CategoryPicker
        visible={categoryPickerKey !== null}
        categories={categoryPickerCategories}
        token={token!}
        onSelect={(id) => {
          if (categoryPickerKey !== null) {
            setTxCategories(prev => ({ ...prev, [categoryPickerKey]: id }))
          }
        }}
        onClose={() => setCategoryPickerKey(null)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: queryKeys.categories() })}
      />

      {/* Modal de confirmação */}
      <Modal visible={confirmModalVisible} transparent animationType="fade" onRequestClose={() => setConfirmModalVisible(false)}>
        {confirmModalVisible && (
        <View style={{ flex: 1, backgroundColor: 'rgba(21,21,26,0.5)', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: colors.bg, borderRadius: 24, overflow: 'hidden' }}>
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink, letterSpacing: -0.3 }}>Confirmar transações</Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                {activeTransactions.length} transação{activeTransactions.length !== 1 ? 'ões' : ''} serão salvas
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
              {activeTransactions.map((t) => {
                const catId = txCategories[t.rowKey]
                const cat = categories.find(c => c.id === catId)
                return (
                  <View key={t.rowKey} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }} numberOfLines={1}>{t.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 11, color: colors.muted }}>{formatDate(t.date)}</Text>
                        {cat ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: cat.color ?? colors.muted }} />
                            <Text style={{ fontSize: 11, color: cat.color ?? colors.muted, fontWeight: '500' }}>{cat.name}</Text>
                          </View>
                        ) : (
                          <Text style={{ fontSize: 11, color: colors.neg }}>sem categoria</Text>
                        )}
                      </View>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.type === 'income' ? colors.pos : colors.neg, marginLeft: 8 }}>
                      {formatAmount(t.amount, t.type)}
                    </Text>
                  </View>
                )
              })}
            </ScrollView>

            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: colors.hairline, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.surface }}>
                <Text style={{ fontSize: 13, color: colors.muted }}>Saldo projetado</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: projectedDelta >= 0 ? colors.pos : colors.neg }}>
                  {projectedDelta >= 0 ? '+' : ''}{projectedDelta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>

              {(() => {
                const withoutCategory = activeTransactions.filter(t => !txCategories[t.rowKey])
                const allHaveCategory = withoutCategory.length === 0
                return allHaveCategory ? (
                  <Pressable
                    onPress={() => {
                      const items: ConfirmItem[] = activeTransactions
                        .filter(t => t.extractedId)
                        .map(t => ({
                          id: t.extractedId!,
                          categoryId: txCategories[t.rowKey],
                        }))
                      confirmMutation.mutate(items)
                    }}
                    disabled={confirmMutation.isPending}
                    style={{ borderRadius: 16, paddingVertical: 15, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {confirmMutation.isPending
                      ? <ActivityIndicator size="small" color="#FBFAF6" />
                      : <Icon.Check size={15} color="#FBFAF6" sw={2.5} />}
                    <Text style={{ fontSize: 15, fontWeight: '500', color: '#FBFAF6' }}>
                      {confirmMutation.isPending ? 'Salvando...' : 'Salvar transações'}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.negSoft, borderWidth: 1, borderColor: colors.neg }}>
                    <Text style={{ fontSize: 12, color: colors.neg, textAlign: 'center' }}>
                      {withoutCategory.length} transação{withoutCategory.length !== 1 ? 'ões' : ''} sem categoria — volte e classifique todas
                    </Text>
                  </View>
                )
              })()}

              <Pressable
                onPress={() => setConfirmModalVisible(false)}
                disabled={confirmMutation.isPending}
                style={{ borderRadius: 16, paddingVertical: 13, borderWidth: 1.5, borderColor: colors.hairline, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.muted }}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
        )}
      </Modal>

      {/* Modal de reanálise em lote */}
      <Modal visible={batchModalVisible} transparent animationType="slide" onRequestClose={() => setBatchModalVisible(false)}>
        {batchModalVisible && (
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(21,21,26,0.5)', justifyContent: 'flex-end' }} onPress={() => setBatchModalVisible(false)}>
          <Pressable onPress={e => e.stopPropagation()}>
            <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: 40 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: 'center', marginBottom: 20 }} />
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ paddingHorizontal: 20, gap: 20, paddingBottom: 8 }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink, letterSpacing: -0.3, marginBottom: 4 }}>
                      Reanalisar {gallerySelected.size} imagem{gallerySelected.size !== 1 ? 'ns' : ''}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.muted }}>Escolha a data de referência para esta análise</Text>
                  </View>

                  <CalendarPicker
                    year={batchCalYear} month={batchCalMonth} selectedDay={batchCalDay}
                    onPrevMonth={() => { const p = prevMonth(batchCalMonth, batchCalYear); setBatchCalMonth(p.month); setBatchCalYear(p.year); setBatchCalDay(1) }}
                    onNextMonth={() => { const n = nextMonth(batchCalMonth, batchCalYear); setBatchCalMonth(n.month); setBatchCalYear(n.year); setBatchCalDay(1) }}
                    onSelectDay={setBatchCalDay}
                  />

                  <Pressable
                    onPress={() => batchExtractMutation.mutate({
                      imageIds: Array.from(gallerySelected),
                      bank: selectedBank,
                      date: toIso(batchCalYear, batchCalMonth, batchCalDay),
                    })}
                    disabled={batchExtractMutation.isPending}
                    style={{ borderRadius: 18, paddingVertical: 16, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {batchExtractMutation.isPending
                      ? <ActivityIndicator size="small" color="#FBFAF6" />
                      : <Icon.ArrowDn size={16} color="#FBFAF6" sw={2} />}
                    <Text style={{ fontSize: 15, fontWeight: '500', color: '#FBFAF6' }}>
                      {batchExtractMutation.isPending ? 'Extraindo...' : 'Extrair transações'}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
        )}
      </Modal>

      <GalleryItemModal
        item={galleryModalItem}
        visible={!!galleryModalItem}
        selectedBank={selectedBank}
        token={token}
        onClose={() => setGalleryModalItem(null)}
        onExtract={(imageId, bank, date) => galleryExtractMutation.mutate({ imageId, bank, date })}
        isExtracting={galleryExtractMutation.isPending}
      />
    </View>
  )
}
