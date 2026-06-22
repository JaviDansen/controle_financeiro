import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
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
  getImportHistory,
  reanalyzeImage,
  DuplicateImageError,
  HeaderNotFoundError,
  type ExtractUploadPayload,
  type ExtractedTransaction,
  type ImportHistoryItem,
  type ImportFormat,
  type ValidationStrategy,
} from '../../services/import.service';

// ─── Constantes ──────────────────────────────────────────────────────────────

const BANKS = [{ id: 'mercadopago', label: 'Mercado Pago' }] as const
const VALIDATORS: { id: ValidationStrategy; label: string; description: string }[] = [
  { id: 'tesseract', label: 'Tesseract', description: 'OCR local · mais rápido' },
  { id: 'gemini',    label: 'Gemini',    description: 'IA · mais preciso' },
]
const DOCUMENT_TYPES = [
  'application/pdf', 'text/csv', 'application/csv',
  'text/comma-separated-values', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

type BankId = typeof BANKS[number]['id']

// Resultado da validação de uma imagem
type ValidatedFile = {
  upload: ExtractUploadPayload
  imageId: string
  detectedDate: string | null
}

// Resultado da extração de uma imagem
type ExtractResult =
  | { status: 'success'; transactions: ExtractedTransaction[] }
  | { status: 'error'; message?: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatDateLong(iso: string) {
  const [y, m, d] = iso.split('-')
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`
}

function bankLabel(bank: string) {
  return bank === 'mercadopago' ? 'Mercado Pago' : bank
}

function statusColor(status: string) {
  if (status === 'processed') return colors.accent
  if (status === 'failed') return colors.neg
  return colors.muted
}

function statusLabel(status: string) {
  if (status === 'processed') return 'Processado'
  if (status === 'failed') return 'Falhou'
  if (status === 'pending') return 'Pendente'
  return status
}

// ─── Modal de detalhe da imagem ───────────────────────────────────────────────

function ImageDetailModal({
  item, visible, selectedValidator, onClose, onReanalyze,
}: {
  item: ImportHistoryItem | null
  visible: boolean
  selectedValidator: ValidationStrategy
  onClose: () => void
  onReanalyze: (imageId: string) => void
}) {
  if (!item) return null

  const dateStr = formatDateLong(item.createdAt.slice(0, 10))
  const isProcessed = item.status === 'processed'
  const isFailed = item.status === 'failed'

  return (
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

            <View style={{ paddingHorizontal: 20, gap: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ gap: 4, flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink, letterSpacing: -0.4 }}>
                    {bankLabel(item.bank)}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted }}>
                    {dateStr} · {item.format.toUpperCase()}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
                  backgroundColor: isProcessed ? colors.accentSoft : isFailed ? colors.negSoft : colors.hairline,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: statusColor(item.status) }}>
                    {statusLabel(item.status)}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{
                  flex: 1, padding: 14, borderRadius: 14,
                  backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
                  alignItems: 'center', gap: 2,
                }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>{item.extractedCount}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>transações</Text>
                </View>
                <View style={{
                  flex: 1, padding: 14, borderRadius: 14,
                  backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
                  alignItems: 'center', gap: 2,
                }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>
                    {item.format === 'screenshot' ? '📸' : '📄'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{item.format}</Text>
                </View>
              </View>

              {item.preview.length > 0 && (
                <View>
                  <Text style={{
                    fontSize: 11, fontWeight: '500', color: colors.muted,
                    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
                  }}>
                    Últimas transações extraídas
                  </Text>
                  <View style={{
                    borderRadius: 14, borderWidth: 1, borderColor: colors.hairline,
                    backgroundColor: colors.surface, overflow: 'hidden',
                  }}>
                    {item.preview.map((t, i) => (
                      <View key={t.id} style={{
                        flexDirection: 'row', alignItems: 'center',
                        paddingHorizontal: 14, paddingVertical: 11,
                        borderBottomWidth: i < item.preview.length - 1 ? 1 : 0,
                        borderBottomColor: colors.hairline,
                      }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }} numberOfLines={1}>
                            {t.title}
                          </Text>
                          <Text style={{ fontSize: 11, color: colors.muted }}>{formatDate(t.date)}</Text>
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: t.type === 'income' ? colors.pos : colors.neg }}>
                          {formatAmount(t.amount, t.type)}
                        </Text>
                      </View>
                    ))}
                    {item.extractedCount > 3 && (
                      <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.hairline }}>
                        <Text style={{ fontSize: 12, color: colors.muted }}>+ {item.extractedCount - 3} outras transações</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {item.extractedCount === 0 && isProcessed && (
                <View style={{
                  padding: 14, borderRadius: 14,
                  backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>Nenhuma transação extraída</Text>
                </View>
              )}

              {isFailed && (
                <View style={{
                  padding: 14, borderRadius: 14,
                  backgroundColor: colors.negSoft, borderWidth: 1, borderColor: colors.neg,
                }}>
                  <Text style={{ fontSize: 13, color: colors.neg }}>
                    Falha ao processar — a imagem pode não ter cabeçalho de data visível.
                  </Text>
                </View>
              )}

              <Pressable
                onPress={() => { onReanalyze(item.id); onClose() }}
                style={{
                  borderRadius: 16, paddingVertical: 14,
                  backgroundColor: colors.ink,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Icon.Refresh size={16} color="#FBFAF6" sw={2} />
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#FBFAF6' }}>
                  Reanalisar com {selectedValidator === 'gemini' ? 'Gemini' : 'Tesseract'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function ImportExtractScreen() {
  const router = useRouter()
  const token = useAuthStore(s => s.token)
  const queryClient = useQueryClient()
  const statusBarHeight = StatusBar.currentHeight ?? 0

  const [selectedBank, setSelectedBank] = useState<BankId>('mercadopago')
  const [selectedValidator, setSelectedValidator] = useState<ValidationStrategy>('tesseract')
  const [uploads, setUploads] = useState<ExtractUploadPayload[]>([])
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [modalItem, setModalItem] = useState<ImportHistoryItem | null>(null)

  // Etapa 1: validação
  const [validatedFiles, setValidatedFiles] = useState<ValidatedFile[] | null>(null)
  const [validationErrors, setValidationErrors] = useState<(string | null)[]>([])

  // Etapa 2: extração
  const [extractResults, setExtractResults] = useState<ExtractResult[] | null>(null)

  const historyQuery = useQuery({
    queryKey: queryKeys.importHistory(),
    queryFn: () => getImportHistory(token!),
    enabled: !!token,
  })

  const reanalyzeMutation = useMutation({
    mutationFn: ({ imageId }: { imageId: string }) =>
      reanalyzeImage(imageId, token!, selectedValidator),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.importHistory() }),
  })

  function resetAll() {
    setUploads([])
    setValidatedFiles(null)
    setValidationErrors([])
    setExtractResults(null)
    setSelectionError(null)
    validateMutation.reset()
    extractMutation.reset()
  }

  function addUploads(items: ExtractUploadPayload[]) {
    setUploads(prev => [...prev, ...items])
    setSelectionError(null)
    setValidatedFiles(null)
    setValidationErrors([])
    setExtractResults(null)
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
    if (!permission.granted) { setSelectionError('Permita acesso à galeria para selecionar imagens.'); return }
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

  // Etapa 1 — valida data
  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Não autenticado')
      const results: (ValidatedFile | null)[] = []
      const errors: (string | null)[] = []

      for (const upload of uploads) {
        try {
          const res = await validateExtractFile(upload, selectedBank, token, selectedValidator)
          results.push({ upload, imageId: res.imageId, detectedDate: res.detectedDate })
          errors.push(null)
        } catch (err) {
          if (err instanceof DuplicateImageError) {
            // Duplicata: trata como válido, usa o imageId existente para extração
            results.push({ upload, imageId: err.imageId!, detectedDate: null })
            errors.push('Imagem já enviada anteriormente — será reanalisada')
          } else if (err instanceof HeaderNotFoundError) {
            results.push(null)
            errors.push('Nenhum cabeçalho de data encontrado')
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
    },
  })

  // Etapa 2 — extrai transações
  const extractMutation = useMutation({
    mutationFn: async () => {
      if (!token || !validatedFiles) throw new Error('Não autenticado')
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
      queryClient.invalidateQueries({ queryKey: queryKeys.importHistory() })
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

          {/* Arquivos */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 }}>
              Arquivos do extrato
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

          {/* Botão Etapa 1 — Validar data */}
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

          {/* Resultado da validação + Botão Etapa 2 */}
          {validateMutation.isSuccess && !extractDone && (
            <View style={{ gap: 12 }}>
              {hasValidFiles && (
                <View style={{
                  padding: 16, borderRadius: 16,
                  backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent,
                  gap: 4,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.accent }}>
                    {validFiles.length === 1 ? 'Data encontrada' : `${validFiles.length} arquivos com data válida`}
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
                    Nenhuma imagem com data válida. Tente outro validador ou outra imagem.
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
                    {extractMutation.isPending
                      ? 'Extraindo transações...'
                      : `Próximo: extrair transações`}
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

          {/* Transações extraídas */}
          {extractDone && allTransactions.length > 0 && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Transações encontradas
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  {allTransactions.length}{skippedCount > 0 ? ` · ${skippedCount} ignoradas` : ''}
                </Text>
              </View>
              <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface, overflow: 'hidden' }}>
                {allTransactions.map((t, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 16, paddingVertical: 13,
                    borderBottomWidth: i < allTransactions.length - 1 ? 1 : 0,
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
                        {t.description}{t.payment_method ? ` · ${t.payment_method}` : ''}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.muted }}>{formatDate(t.date)} · {t.time}</Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: t.type === 'income' ? colors.pos : colors.neg }}>
                      {formatAmount(t.amount, t.type)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {extractDone && allTransactions.length === 0 && (
            <View style={{
              borderRadius: 16, padding: 24,
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
              alignItems: 'center', gap: 8,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>Nenhuma transação encontrada</Text>
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>
                Verifique se a imagem mostra a lista de atividades com datas visíveis.
              </Text>
            </View>
          )}

          {extractDone && (
            <Pressable onPress={resetAll} style={{
              borderRadius: 18, paddingVertical: 14,
              borderWidth: 1.5, borderColor: colors.hairline, alignItems: 'center',
            }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.muted }}>Analisar outras imagens</Text>
            </Pressable>
          )}

          {/* Galeria de envios anteriores */}
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingLeft: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Envios anteriores
              </Text>
              {historyQuery.isFetching && <ActivityIndicator size="small" color={colors.muted} />}
            </View>

            {historyQuery.data && historyQuery.data.length === 0 && (
              <View style={{
                borderRadius: 16, padding: 20, borderWidth: 1, borderStyle: 'dashed',
                borderColor: colors.hairline, backgroundColor: colors.surface,
                alignItems: 'center', gap: 6,
              }}>
                <Icon.Image size={22} color={colors.muted} sw={1.6} />
                <Text style={{ fontSize: 13, color: colors.muted }}>Nenhum envio anterior</Text>
              </View>
            )}

            {historyQuery.data && historyQuery.data.length > 0 && (
              <View style={{ gap: 8 }}>
                {historyQuery.data.map((item) => {
                  const isProcessed = item.status === 'processed'
                  const isFailed = item.status === 'failed'
                  const isReanalyzing = reanalyzeMutation.isPending && reanalyzeMutation.variables?.imageId === item.id

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setModalItem(item)}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        padding: 14, borderRadius: 16,
                        backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
                        gap: 12,
                      }}
                    >
                      <View style={{
                        width: 42, height: 42, borderRadius: 12,
                        backgroundColor: isProcessed ? colors.accentSoft : isFailed ? colors.negSoft : colors.hairline,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isReanalyzing
                          ? <ActivityIndicator size="small" color={colors.muted} />
                          : isProcessed
                            ? <Icon.Check size={18} color={colors.accent} sw={2.5} />
                            : isFailed
                              ? <Icon.X size={18} color={colors.neg} sw={2.5} />
                              : <Icon.Image size={18} color={colors.muted} sw={1.8} />
                        }
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>
                          {bankLabel(item.bank)}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.muted }}>
                          {formatDateLong(item.createdAt.slice(0, 10))}
                        </Text>
                        {isProcessed && item.extractedCount > 0 && (
                          <Text style={{ fontSize: 11, color: colors.accent, fontWeight: '500', marginTop: 1 }}>
                            {item.extractedCount} {item.extractedCount === 1 ? 'transação' : 'transações'}
                          </Text>
                        )}
                        {isFailed && (
                          <Text style={{ fontSize: 11, color: colors.neg, marginTop: 1 }}>Falhou</Text>
                        )}
                      </View>
                      <Icon.ChevR size={14} color={colors.muted} sw={1.8} />
                    </Pressable>
                  )
                })}
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      <ImageDetailModal
        item={modalItem}
        visible={!!modalItem}
        selectedValidator={selectedValidator}
        onClose={() => setModalItem(null)}
        onReanalyze={(imageId) => reanalyzeMutation.mutate({ imageId })}
      />
    </View>
  )
}
