import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '../../src/components/ui/Icon';
import { colors } from '../../src/theme/colors';
import { useAuthStore } from '../../store/auth.store';
import { queryKeys } from '../../src/lib/queryKeys';
import {
  validateExtractFile,
  extractByImageId,
  getImportGallery,
  DuplicateImageError,
  HeaderNotFoundError,
  type ExtractUploadPayload,
  type ExtractedTransaction,
  type GalleryItem,
  type ImportFormat,
  type ValidationStrategy,
} from '../../services/import.service';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Constantes Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const BANKS = [{ id: 'mercadopago', label: 'Mercado Pago' }] as const
const VALIDATORS: { id: ValidationStrategy; label: string; description: string }[] = [
  { id: 'tesseract', label: 'Tesseract', description: 'OCR local Ã‚Â· mais rÃƒÂ¡pido' },
  { id: 'gemini',    label: 'Gemini',    description: 'IA Ã‚Â· mais preciso' },
]
const DOCUMENT_TYPES = [
  'application/pdf', 'text/csv', 'application/csv',
  'text/comma-separated-values', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const MONTHS = ['Janeiro','Fevereiro','MarÃƒÂ§o','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const WEEKDAYS = ['D','S','T','Q','Q','S','S']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

type BankId = typeof BANKS[number]['id']

type ValidatedFile = {
  upload: ExtractUploadPayload
  imageId: string
  detectedDate: string | null
}

type ExtractResult =
  | { status: 'success'; transactions: ExtractedTransaction[] }
  | { status: 'error'; message?: string }

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}

function bankLabel(bank: string) {
  return bank === 'mercadopago' ? 'Mercado Pago' : bank
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

// Baixa uma imagem autenticada para o cache local e retorna a URI local.
// Usa o imageId como chave de cache Ã¢â‚¬â€ nÃƒÂ£o rebaixa se jÃƒÂ¡ existir.
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

function useGalleryUris(items: GalleryItem[] | undefined, token: string | null) {
  const [uris, setUris] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!items || !token) return
    items.forEach(item => {
      fetchAuthImage(item.imageId, token, item.fileName)
        .then(uri => setUris(prev => ({ ...prev, [item.imageId]: uri })))
        .catch(() => {})
    })
  }, [items, token])
  return uris
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Modal da galeria Ã¢â‚¬â€ seleciona banco e data Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function GalleryItemModal({
  item,
  visible,
  selectedBank,
  token,
  onClose,
  onExtract,
  isExtracting,
}: {
  item: GalleryItem | null
  visible: boolean
  selectedBank: BankId
  token: string | null
  onClose: () => void
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

  // Carrega a imagem via download autenticado para cache local e usa URI local
  useEffect(() => {
    if (!item || !token || !visible) return
    setImgUri(null)
    fetchAuthImage(item.imageId, token, item.fileName)
      .then((uri) => setImgUri(uri))
      .catch(() => setImgUri(null))
  }, [item?.imageId, token, visible])

  // Reseta o calendÃƒÂ¡rio para o mÃƒÂªs atual ao abrir
  useEffect(() => {
    setViewerVisible(false)
    if (visible) {
      const d = new Date()
      setCalMonth(d.getMonth())
      setCalYear(d.getFullYear())
      setSelectedDay(d.getDate())
    }
  }, [visible])

  if (!item) return null

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDow = getFirstDayOfWeek(calYear, calMonth)
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Preenche atÃƒÂ© completar a ÃƒÂºltima linha
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
    setSelectedDay(1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
    setSelectedDay(1)
  }

  const dateParam = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(21,21,26,0.5)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={e => e.stopPropagation()}>
          <View style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            paddingTop: 12, paddingBottom: 40,
          }}>
            <View style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: colors.hairline, alignSelf: 'center', marginBottom: 20,
            }} />

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ paddingHorizontal: 20, gap: 20, paddingBottom: 8 }}>

                {/* Preview da imagem */}
                <View style={{
                  borderRadius: 16, overflow: 'hidden',
                  borderWidth: 1, borderColor: colors.hairline,
                  height: 160, backgroundColor: colors.surface,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {imgUri ? (
                    <Pressable onPress={() => setViewerVisible(true)} style={{ width: '100%', height: '100%' }}>
                      <Image source={{ uri: imgUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                      <View style={{
                        position: 'absolute', right: 10, bottom: 10,
                        paddingHorizontal: 10, paddingVertical: 6,
                        borderRadius: 999, backgroundColor: 'rgba(21,21,26,0.72)',
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#FBFAF6' }}>Toque para ampliar</Text>
                      </View>
                    </Pressable>
                  ) : (
                    <ActivityIndicator size="small" color={colors.muted} />
                  )}
                </View>

                {/* Banco */}
                <View>
                  <Text style={{
                    fontSize: 11, fontWeight: '500', color: colors.muted,
                    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
                  }}>
                    Banco selecionado
                  </Text>
                  <View style={{
                    padding: 14, borderRadius: 14,
                    backgroundColor: colors.ink,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#FBFAF6' }}>
                      {bankLabel(selectedBank)}
                    </Text>
                    <Icon.Check size={14} color="#FBFAF6" sw={2.5} />
                  </View>
                </View>

                {/* CalendÃƒÂ¡rio */}
                <View>
                  <Text style={{
                    fontSize: 11, fontWeight: '500', color: colors.muted,
                    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
                  }}>
                    Data do extrato
                  </Text>

                  <View style={{
                    borderRadius: 18, borderWidth: 1, borderColor: colors.hairline,
                    backgroundColor: colors.surface, overflow: 'hidden',
                  }}>
                    {/* CabeÃƒÂ§alho mÃƒÂªs/ano */}
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingHorizontal: 16, paddingVertical: 14,
                      borderBottomWidth: 1, borderBottomColor: colors.hairline,
                    }}>
                      <Pressable onPress={prevMonth} hitSlop={12} style={{
                        width: 32, height: 32, borderRadius: 8,
                        backgroundColor: colors.hairline, alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon.ChevL size={14} color={colors.ink} sw={2.5} />
                      </Pressable>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink, letterSpacing: -0.3 }}>
                        {MONTHS[calMonth]} {calYear}
                      </Text>
                      <Pressable onPress={nextMonth} hitSlop={12} style={{
                        width: 32, height: 32, borderRadius: 8,
                        backgroundColor: colors.hairline, alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon.ChevR size={14} color={colors.ink} sw={2.5} />
                      </Pressable>
                    </View>

                    {/* Dias da semana */}
                    <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingTop: 10, paddingBottom: 4 }}>
                      {WEEKDAYS.map((d, i) => (
                        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.muted }}>{d}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Grade de dias */}
                    <View style={{ paddingHorizontal: 8, paddingBottom: 12 }}>
                      {Array.from({ length: cells.length / 7 }, (_, row) => (
                        <View key={row} style={{ flexDirection: 'row' }}>
                          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                            const isSelected = day === selectedDay
                            const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear()
                            return (
                              <Pressable
                                key={col}
                                onPress={() => day && setSelectedDay(day)}
                                disabled={!day}
                                style={{
                                  flex: 1, alignItems: 'center', justifyContent: 'center',
                                  paddingVertical: 5,
                                }}
                              >
                                <View style={{
                                  width: 34, height: 34, borderRadius: 17,
                                  alignItems: 'center', justifyContent: 'center',
                                  backgroundColor: isSelected ? colors.ink : 'transparent',
                                  borderWidth: isToday && !isSelected ? 1.5 : 0,
                                  borderColor: colors.ink,
                                }}>
                                  {day ? (
                                    <Text style={{
                                      fontSize: 13,
                                      fontWeight: isSelected ? '600' : '400',
                                      color: isSelected ? '#FBFAF6' : isToday ? colors.ink : colors.ink,
                                    }}>
                                      {day}
                                    </Text>
                                  ) : null}
                                </View>
                              </Pressable>
                            )
                          })}
                        </View>
                      ))}
                    </View>

                    {/* Data selecionada resumida */}
                    <View style={{
                      borderTopWidth: 1, borderTopColor: colors.hairline,
                      paddingHorizontal: 16, paddingVertical: 12,
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                    }}>
                      <Icon.Calendar size={13} color={colors.muted} sw={1.8} />
                      <Text style={{ fontSize: 13, color: colors.muted }}>
                        Selecionado:{' '}
                        <Text style={{ fontWeight: '600', color: colors.ink }}>
                          {selectedDay} de {MONTHS[calMonth]} de {calYear}
                        </Text>
                      </Text>
                    </View>
                  </View>
                </View>

                {/* BotÃƒÂ£o extrair */}
                <Pressable
                  onPress={() => onExtract(item.imageId, selectedBank, dateParam)}
                  disabled={isExtracting}
                  style={{
                    borderRadius: 18, paddingVertical: 16,
                    backgroundColor: colors.ink,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {isExtracting
                    ? <ActivityIndicator size="small" color="#FBFAF6" />
                    : <Icon.ArrowDn size={16} color="#FBFAF6" sw={2} />
                  }
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#FBFAF6' }}>
                    {isExtracting ? 'Extraindo transaÃƒÂ§ÃƒÂµes...' : 'Extrair transaÃƒÂ§ÃƒÂµes'}
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
          <Pressable
            onPress={() => setViewerVisible(false)}
            style={{
              position: 'absolute', top: (StatusBar.currentHeight ?? 0) + 16, right: 16,
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: 'rgba(255,255,255,0.12)',
              alignItems: 'center', justifyContent: 'center', zIndex: 2,
            }}
          >
            <Icon.X size={18} color="#FBFAF6" sw={2.4} />
          </Pressable>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bouncesZoom
            centerContent
            pinchGestureEnabled
          >
            {imgUri ? (
              <Image
                source={{ uri: imgUri }}
                style={{ width: screenWidth, height: screenHeight * 0.82 }}
                resizeMode="contain"
              />
            ) : null}
          </ScrollView>

          <View style={{ paddingBottom: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: 'rgba(251,250,246,0.78)' }}>
              Use dois dedos para ampliar e arrastar
            </Text>
          </View>
        </View>
      </Modal>
    </>
  )
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Tela principal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export default function ImportExtractScreen() {
  const router = useRouter()
  const token = useAuthStore(s => s.token)
  const queryClient = useQueryClient()
  const statusBarHeight = StatusBar.currentHeight ?? 0

  const [selectedBank, setSelectedBank] = useState<BankId>('mercadopago')
  const [selectedValidator, setSelectedValidator] = useState<ValidationStrategy>('tesseract')
  const [uploads, setUploads] = useState<ExtractUploadPayload[]>([])
  const [selectionError, setSelectionError] = useState<string | null>(null)

  // Galeria
  const [galleryModalItem, setGalleryModalItem] = useState<GalleryItem | null>(null)
  const [galleryExtractResults, setGalleryExtractResults] = useState<ExtractedTransaction[] | null>(null)

  // Etapa 1: validaÃƒÂ§ÃƒÂ£o de novos uploads
  const [validatedFiles, setValidatedFiles] = useState<ValidatedFile[] | null>(null)
  const [validationErrors, setValidationErrors] = useState<(string | null)[]>([])

  // Etapa 2: extraÃƒÂ§ÃƒÂ£o de novos uploads
  const [extractResults, setExtractResults] = useState<ExtractResult[] | null>(null)

  const galleryQuery = useQuery({
    queryKey: queryKeys.importGallery(),
    queryFn: () => getImportGallery(token!),
    enabled: !!token,
  })
  const galleryUris = useGalleryUris(galleryQuery.data, token)

  const galleryExtractMutation = useMutation({
    mutationFn: ({ imageId, bank, date }: { imageId: string; bank: BankId; date: string }) =>
      extractByImageId(imageId, bank, token!, date),
    onSuccess: (res) => {
      setGalleryExtractResults(res.transactions.filter(t => !t.skipped))
      setGalleryModalItem(null)
    },
  })

  function resetAll() {
    setUploads([])
    setValidatedFiles(null)
    setValidationErrors([])
    setExtractResults(null)
    setSelectionError(null)
    setGalleryExtractResults(null)
    validateMutation.reset()
    extractMutation.reset()
  }

  function addUploads(items: ExtractUploadPayload[]) {
    setUploads(prev => [...prev, ...items])
    setSelectionError(null)
    setValidatedFiles(null)
    setValidationErrors([])
    setExtractResults(null)
    setGalleryExtractResults(null)
    validateMutation.reset()
  }

  function removeUpload(index: number) {
    setUploads(prev => prev.filter((_, i) => i !== index))
    setValidatedFiles(null)
    setValidationErrors([])
    setExtractResults(null)
    validateMutation.reset()
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) { setSelectionError('Permita acesso ÃƒÂ  galeria para selecionar imagens.'); return }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], base64: true, quality: 0.8, allowsMultipleSelection: true,
    })
    if (picked.canceled) return
    const valid: ExtractUploadPayload[] = picked.assets.filter(a => a.base64).map(a => ({
      fileBase64: a.base64!,
      fileName: a.fileName ?? 'imagem.jpg',
      format: 'screenshot' as const,
      mimeType: a.mimeType,
    }))
    if (!valid.length) { setSelectionError('NÃƒÂ£o foi possÃƒÂ­vel ler as imagens.'); return }
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
      if (!valid.length) { setSelectionError('Formato nÃƒÂ£o suportado. Use PDF, CSV, XLS ou XLSX.'); return }
      addUploads(valid)
    } catch { setSelectionError('NÃƒÂ£o foi possÃƒÂ­vel ler o arquivo.') }
  }

  // Etapa 1 Ã¢â‚¬â€ valida data
  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('NÃƒÂ£o autenticado')
      const results: (ValidatedFile | null)[] = []
      const errors: (string | null)[] = []

      for (const upload of uploads) {
        try {
          const res = await validateExtractFile(upload, selectedBank, token, selectedValidator)
          results.push({ upload, imageId: res.imageId, detectedDate: res.detectedDate })
          errors.push(null)
        } catch (err) {
          if (err instanceof DuplicateImageError) {
            results.push({ upload, imageId: err.imageId!, detectedDate: null })
            errors.push('Imagem jÃƒÂ¡ enviada anteriormente Ã¢â‚¬â€ serÃƒÂ¡ reanalisada')
          } else if (err instanceof HeaderNotFoundError) {
            results.push(null)
            errors.push('Nenhum cabeÃƒÂ§alho de data encontrado')
          } else {
            results.push(null)
            errors.push(err instanceof Error ? err.message : 'Erro ao validar')
          }
        }
      }
      return { results, errors }
    },
    onSuccess: ({ results, errors }) => {
      setValidatedFiles(results.filter((r): r is ValidatedFile => r !== null))
      setValidationErrors(errors)
      // Atualiza galeria pois novas imagens foram salvas
      queryClient.invalidateQueries({ queryKey: queryKeys.importGallery() })
    },
  })

  // Etapa 2 Ã¢â‚¬â€ extrai transaÃƒÂ§ÃƒÂµes dos novos uploads
  const extractMutation = useMutation({
    mutationFn: async () => {
      if (!token || !validatedFiles) throw new Error('NÃƒÂ£o autenticado')
      const results: ExtractResult[] = []
      for (const vf of validatedFiles) {
        try {
          const res = await extractByImageId(vf.imageId, selectedBank, token)
          results.push({ status: 'success', transactions: res.transactions })
        } catch (err) {
          results.push({ status: 'error', message: err instanceof Error ? err.message : undefined })
        }
      }
      return results
    },
    onSuccess: (results) => {
      setExtractResults(results)
    },
  })

  const allTransactions: ExtractedTransaction[] = (extractResults ?? [])
    .flatMap(r => r.status === 'success' ? r.transactions : [])
    .filter(t => !t.skipped)

  const skippedCount = (extractResults ?? [])
    .flatMap(r => r.status === 'success' ? r.transactions : [])
    .filter(t => t.skipped).length

  const validFiles = validatedFiles?.filter(v => v.imageId) ?? []
  const hasValidFiles = validFiles.length > 0
  const extractDone = extractResults !== null

  // TransaÃƒÂ§ÃƒÂµes resultantes de uma imagem da galeria
  const activeTransactions = galleryExtractResults ?? allTransactions
  const activeSkippedCount = galleryExtractResults ? 0 : skippedCount
  const showResults = galleryExtractResults !== null || extractDone

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: statusBarHeight }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 22, paddingTop: 8, paddingBottom: 20,
        }}>
          <Pressable onPress={() => router.back()} style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.ChevL size={16} color={colors.ink} sw={2.5} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '500', color: colors.ink, letterSpacing: -0.3 }}>
              Importar extrato
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>
              Envie imagem, PDF ou planilha do seu banco
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={{ paddingHorizontal: 16, gap: 20 }}>

          {/* Banco */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 }}>
              Banco
            </Text>
            <View style={{ gap: 8 }}>
              {BANKS.map(bank => {
                const active = selectedBank === bank.id
                return (
                  <Pressable key={bank.id} onPress={() => setSelectedBank(bank.id)} style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    padding: 16, borderRadius: 16, borderWidth: 1.5,
                    borderColor: active ? colors.ink : colors.hairline,
                    backgroundColor: active ? colors.ink : colors.surface,
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: active ? '#FBFAF6' : colors.ink }}>
                      {bank.label}
                    </Text>
                    {active && <Icon.Check size={14} color="#FBFAF6" sw={2.5} />}
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Validador */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 }}>
              Validador de data
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {VALIDATORS.map(v => {
                const active = selectedValidator === v.id
                return (
                  <Pressable key={v.id} onPress={() => setSelectedValidator(v.id)} style={{
                    flex: 1, padding: 14, borderRadius: 16, borderWidth: 1.5,
                    borderColor: active ? colors.ink : colors.hairline,
                    backgroundColor: active ? colors.ink : colors.surface, gap: 2,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#FBFAF6' : colors.ink }}>
                      {v.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: active ? 'rgba(251,250,246,0.6)' : colors.muted }}>
                      {v.description}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Novos arquivos */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 }}>
              Enviar novo arquivo
            </Text>

            {uploads.length > 0 && (
              <View style={{ gap: 8, marginBottom: 10 }}>
                {uploads.map((upload, index) => {
                  const validated = validatedFiles?.[index]
                  const err = validationErrors[index]
                  const hasDate = validated?.detectedDate
                  const hasFailed = err && !validated

                  return (
                    <View key={index} style={{
                      flexDirection: 'row', alignItems: 'center',
                      padding: 12, borderRadius: 14, borderWidth: 1,
                      borderColor: hasDate ? colors.accent : hasFailed ? colors.neg : colors.hairline,
                      backgroundColor: hasDate ? colors.accentSoft : hasFailed ? colors.negSoft : colors.surface,
                      gap: 10,
                    }}>
                      <View style={{
                        width: 32, height: 32, borderRadius: 8,
                        backgroundColor: hasDate ? colors.accent : hasFailed ? colors.neg : colors.hairline,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {hasDate
                          ? <Icon.Check size={14} color="#fff" sw={2.5} />
                          : hasFailed
                            ? <Icon.X size={14} color="#fff" sw={2.5} />
                            : <Icon.Upload size={14} color={colors.muted} sw={1.8} />
                        }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }} numberOfLines={1}>
                          {upload.fileName}
                        </Text>
                        {hasDate && (
                          <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '500', marginTop: 1 }}>
                            Data: {validated!.detectedDate}
                          </Text>
                        )}
                        {err && (
                          <Text style={{ fontSize: 11, color: hasFailed ? colors.neg : '#9A8030', marginTop: 1 }}>
                            {err}
                          </Text>
                        )}
                        {!hasDate && !err && (
                          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>
                            {upload.format.toUpperCase()}
                          </Text>
                        )}
                      </View>
                      {!validateMutation.isPending && !hasDate && (
                        <Pressable onPress={() => removeUpload(index)} hitSlop={8} style={{
                          width: 24, height: 24, borderRadius: 12,
                          backgroundColor: colors.hairline, alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon.X size={12} color={colors.muted} sw={2} />
                        </Pressable>
                      )}
                    </View>
                  )
                })}
              </View>
            )}

            {!validateMutation.isSuccess && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={pickImage} style={{
                  flex: 1, borderRadius: 14, paddingVertical: 13,
                  backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }}>+ Imagens</Text>
                </Pressable>
                <Pressable onPress={pickDocument} style={{
                  flex: 1, borderRadius: 14, paddingVertical: 13,
                  backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }}>+ Arquivo</Text>
                </Pressable>
              </View>
            )}

            {uploads.length === 0 && (
              <View style={{
                borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
                borderColor: colors.hairline, backgroundColor: colors.surface,
                padding: 24, alignItems: 'center', gap: 10, marginTop: 10,
              }}>
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

          {selectionError && (
            <Text style={{ fontSize: 13, color: colors.neg, textAlign: 'center' }}>{selectionError}</Text>
          )}

          {/* BotÃƒÂ£o Etapa 1 Ã¢â‚¬â€ Validar data */}
          {!validateMutation.isSuccess && (
            <Pressable
              onPress={() => validateMutation.mutate()}
              disabled={uploads.length === 0 || validateMutation.isPending}
              style={{
                borderRadius: 18, paddingVertical: 16,
                backgroundColor: uploads.length > 0 ? colors.ink : colors.hairline,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {validateMutation.isPending
                ? <ActivityIndicator size="small" color="#FBFAF6" />
                : <Icon.Calendar size={16} color={uploads.length > 0 ? '#FBFAF6' : colors.muted} sw={2} />
              }
              <Text style={{ fontSize: 15, fontWeight: '500', color: uploads.length > 0 ? '#FBFAF6' : colors.muted }}>
                {validateMutation.isPending ? 'Verificando data...' : 'Validar data'}
              </Text>
            </Pressable>
          )}

          {/* Resultado da validaÃƒÂ§ÃƒÂ£o + BotÃƒÂ£o Etapa 2 */}
          {validateMutation.isSuccess && !extractDone && (
            <View style={{ gap: 12 }}>
              {hasValidFiles && (
                <View style={{
                  padding: 16, borderRadius: 16,
                  backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent,
                  gap: 4,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.accent }}>
                    {validFiles.length === 1 ? 'Data encontrada' : `${validFiles.length} arquivos com data vÃƒÂ¡lida`}
                  </Text>
                  {validFiles.map((vf, i) => vf.detectedDate && (
                    <Text key={i} style={{ fontSize: 13, color: colors.ink }}>
                      {validFiles.length > 1 ? `${vf.upload.fileName}: ` : ''}{vf.detectedDate}
                    </Text>
                  ))}
                </View>
              )}

              {!hasValidFiles && (
                <View style={{
                  padding: 16, borderRadius: 16,
                  backgroundColor: colors.negSoft, borderWidth: 1, borderColor: colors.neg,
                }}>
                  <Text style={{ fontSize: 13, color: colors.neg }}>
                    Nenhuma imagem com data vÃƒÂ¡lida. Tente outro validador ou outra imagem.
                  </Text>
                </View>
              )}

              {hasValidFiles && (
                <Pressable
                  onPress={() => extractMutation.mutate()}
                  disabled={extractMutation.isPending}
                  style={{
                    borderRadius: 18, paddingVertical: 16,
                    backgroundColor: colors.ink,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {extractMutation.isPending
                    ? <ActivityIndicator size="small" color="#FBFAF6" />
                    : <Icon.ArrowDn size={16} color="#FBFAF6" sw={2} />
                  }
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#FBFAF6' }}>
                    {extractMutation.isPending ? 'Extraindo transaÃƒÂ§ÃƒÂµes...' : 'Extrair transaÃƒÂ§ÃƒÂµes'}
                  </Text>
                </Pressable>
              )}

              <Pressable onPress={resetAll} style={{
                borderRadius: 18, paddingVertical: 14,
                borderWidth: 1.5, borderColor: colors.hairline, alignItems: 'center',
              }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.muted }}>Trocar imagem</Text>
              </Pressable>
            </View>
          )}

          {/* TransaÃƒÂ§ÃƒÂµes extraÃƒÂ­das */}
          {showResults && activeTransactions.length > 0 && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  TransaÃƒÂ§ÃƒÂµes encontradas
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  {activeTransactions.length}{activeSkippedCount > 0 ? ` Ã‚Â· ${activeSkippedCount} ignoradas` : ''}
                </Text>
              </View>
              <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface, overflow: 'hidden' }}>
                {activeTransactions.map((t, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 16, paddingVertical: 13,
                    borderBottomWidth: i < activeTransactions.length - 1 ? 1 : 0,
                    borderBottomColor: colors.hairline,
                  }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }} numberOfLines={1}>{t.title}</Text>
                        {t.date_inferred && (
                          <View style={{ paddingHorizontal: 5, paddingVertical: 1, backgroundColor: '#F5F0DC', borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, color: '#9A8030', fontWeight: '600' }}>DATA?</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>
                        {t.description}{t.payment_method ? ` Ã‚Â· ${t.payment_method}` : ''}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.muted }}>{formatDate(t.date)} Ã‚Â· {t.time}</Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: t.type === 'income' ? colors.pos : colors.neg }}>
                      {formatAmount(t.amount, t.type)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {showResults && activeTransactions.length === 0 && (
            <View style={{
              borderRadius: 16, padding: 24,
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
              alignItems: 'center', gap: 8,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>Nenhuma transaÃƒÂ§ÃƒÂ£o encontrada</Text>
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>
                Verifique se a imagem mostra a lista de atividades com datas visÃƒÂ­veis.
              </Text>
            </View>
          )}

          {showResults && (
            <Pressable onPress={resetAll} style={{
              borderRadius: 18, paddingVertical: 14,
              borderWidth: 1.5, borderColor: colors.hairline, alignItems: 'center',
            }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.muted }}>Analisar outras imagens</Text>
            </Pressable>
          )}

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Galeria de imagens da pasta Ã¢â€â‚¬Ã¢â€â‚¬ */}
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingLeft: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Imagens disponÃƒÂ­veis
              </Text>
              {galleryQuery.isFetching && <ActivityIndicator size="small" color={colors.muted} />}
            </View>

            {galleryQuery.data && galleryQuery.data.length === 0 && (
              <View style={{
                borderRadius: 16, padding: 20, borderWidth: 1, borderStyle: 'dashed',
                borderColor: colors.hairline, backgroundColor: colors.surface,
                alignItems: 'center', gap: 6,
              }}>
                <Icon.Image size={22} color={colors.muted} sw={1.6} />
                <Text style={{ fontSize: 13, color: colors.muted }}>Nenhuma imagem na pasta</Text>
              </View>
            )}

            {galleryQuery.data && galleryQuery.data.length > 0 && (
              <View style={{
                flexDirection: 'row', flexWrap: 'wrap', gap: 8,
              }}>
                {galleryQuery.data.map((item) => (
                  <Pressable
                    key={item.imageId}
                    onPress={() => { setGalleryExtractResults(null); setGalleryModalItem(item) }}
                    style={{
                      width: '31%',
                      aspectRatio: 1,
                      borderRadius: 12,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      backgroundColor: colors.surface,
                    }}
                  >
                    {galleryUris[item.imageId] ? (
                      <Image
                        source={{ uri: galleryUris[item.imageId] }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="small" color={colors.muted} />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

        </View>
      </ScrollView>

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




