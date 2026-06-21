import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { useMutation } from '@tanstack/react-query';
import { Icon } from '../../src/components/ui/Icon';
import { colors } from '../../src/theme/colors';
import { useAuthStore } from '../../store/auth.store';
import {
  sendExtractFile,
  DuplicateImageError,
  HeaderNotFoundError,
  type ExtractUploadPayload,
  type ExtractedTransaction,
  type ImportFormat,
  type ValidationStrategy,
} from '../../services/import.service';

const BANKS = [
  { id: 'mercadopago', label: 'Mercado Pago' },
] as const

const VALIDATORS: { id: ValidationStrategy; label: string; description: string }[] = [
  { id: 'tesseract', label: 'Tesseract', description: 'OCR local — mais rápido' },
  { id: 'gemini',    label: 'Gemini',    description: 'IA — mais preciso' },
]

const DOCUMENT_TYPES = [
  'application/pdf',
  'text/csv',
  'application/csv',
  'text/comma-separated-values',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

type BankId = typeof BANKS[number]['id']

type FileResult =
  | { status: 'success'; transactions: ExtractedTransaction[] }
  | { status: 'duplicate' }
  | { status: 'header_not_found' }
  | { status: 'error'; message?: string }

function inferFormat(fileName?: string | null, mimeType?: string | null): ImportFormat | null {
  const extension = fileName?.split('.').pop()?.toLowerCase()
  if (extension === 'csv') return 'csv'
  if (extension === 'pdf') return 'pdf'
  if (extension === 'xls') return 'xls'
  if (extension === 'xlsx') return 'xlsx'
  if (mimeType?.startsWith('image/')) return 'screenshot'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType?.includes('spreadsheetml')) return 'xlsx'
  if (mimeType?.includes('csv')) return 'csv'
  if (mimeType === 'application/vnd.ms-excel') return 'xls'
  return null
}

function formatAmount(amount: number, type: 'income' | 'expense') {
  const formatted = amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return type === 'income' ? `+R$ ${formatted}` : `-R$ ${formatted}`
}

function formatDate(iso: string) {
  const [, m, d] = iso.split('-')
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}

export default function ImportExtractScreen() {
  const router = useRouter()
  const token = useAuthStore(s => s.token)
  const statusBarHeight = StatusBar.currentHeight ?? 0

  const [selectedBank, setSelectedBank] = useState<BankId>('mercadopago')
  const [selectedValidator, setSelectedValidator] = useState<ValidationStrategy>('tesseract')
  const [uploads, setUploads] = useState<ExtractUploadPayload[]>([])
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [fileResults, setFileResults] = useState<FileResult[] | null>(null)

  const allTransactions: ExtractedTransaction[] = (fileResults ?? [])
    .flatMap(r => r.status === 'success' ? r.transactions : [])
    .filter(t => !t.skipped)

  const skippedCount = (fileResults ?? [])
    .flatMap(r => r.status === 'success' ? r.transactions : [])
    .filter(t => t.skipped).length

  function addUploads(newItems: ExtractUploadPayload[]) {
    setUploads(prev => [...prev, ...newItems])
    setSelectionError(null)
    setFileResults(null)
    mutation.reset()
  }

  function removeUpload(index: number) {
    setUploads(prev => prev.filter((_, i) => i !== index))
    setFileResults(null)
    mutation.reset()
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setSelectionError('Permita acesso a galeria para selecionar imagens.')
      return
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
      allowsMultipleSelection: true,
    })
    if (picked.canceled) return
    const valid: ExtractUploadPayload[] = []
    for (const asset of picked.assets) {
      if (!asset.base64) continue
      valid.push({
        fileBase64: asset.base64,
        fileName: asset.fileName ?? 'imagem-selecionada.jpg',
        format: 'screenshot',
        mimeType: asset.mimeType,
      })
    }
    if (valid.length === 0) { setSelectionError('Nao foi possivel ler as imagens.'); return }
    addUploads(valid)
  }

  async function pickDocument() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: DOCUMENT_TYPES,
        copyToCacheDirectory: true,
        multiple: true,
      })
      if (picked.canceled || !picked.assets?.length) return
      const valid: ExtractUploadPayload[] = []
      for (const asset of picked.assets) {
        const format = inferFormat(asset.name, asset.mimeType)
        if (!format) continue
        const fileBase64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        })
        valid.push({ fileBase64, fileName: asset.name, format, mimeType: asset.mimeType })
      }
      if (valid.length === 0) { setSelectionError('Formato nao suportado. Use PDF, CSV, XLS ou XLSX.'); return }
      addUploads(valid)
    } catch {
      setSelectionError('Nao foi possivel ler o arquivo selecionado.')
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Nao autenticado')
      const settled: FileResult[] = []
      for (const upload of uploads) {
        try {
          const response = await sendExtractFile(upload, selectedBank, token, selectedValidator)
          settled.push({ status: 'success', transactions: response.transactions })
        } catch (err) {
          if (err instanceof DuplicateImageError) settled.push({ status: 'duplicate' })
          else if (err instanceof HeaderNotFoundError) settled.push({ status: 'header_not_found' })
          else settled.push({ status: 'error', message: err instanceof Error ? err.message : undefined })
        }
      }
      return settled
    },
    onSuccess: (settled) => setFileResults(settled),
  })

  const allDone = fileResults !== null
  const canSend = uploads.length > 0 && !mutation.isPending && !allDone

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
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
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

          {/* Seleção de banco */}
          <View>
            <Text style={{
              fontSize: 11, fontWeight: '500', color: colors.muted,
              textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4,
            }}>
              Banco
            </Text>
            <View style={{ gap: 8 }}>
              {BANKS.map(bank => {
                const active = selectedBank === bank.id
                return (
                  <Pressable
                    key={bank.id}
                    onPress={() => setSelectedBank(bank.id)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      padding: 16, borderRadius: 16, borderWidth: 1.5,
                      borderColor: active ? colors.ink : colors.hairline,
                      backgroundColor: active ? colors.ink : colors.surface,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '500', color: active ? '#FBFAF6' : colors.ink }}>
                      {bank.label}
                    </Text>
                    {active && <Icon.Check size={14} color="#FBFAF6" sw={2.5} />}
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Seleção de validador */}
          <View>
            <Text style={{
              fontSize: 11, fontWeight: '500', color: colors.muted,
              textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4,
            }}>
              Validador de data
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {VALIDATORS.map(v => {
                const active = selectedValidator === v.id
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => setSelectedValidator(v.id)}
                    style={{
                      flex: 1, padding: 14, borderRadius: 16, borderWidth: 1.5,
                      borderColor: active ? colors.ink : colors.hairline,
                      backgroundColor: active ? colors.ink : colors.surface,
                      gap: 2,
                    }}
                  >
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
            <Text style={{
              fontSize: 11, fontWeight: '500', color: colors.muted,
              textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4,
            }}>
              Arquivos do extrato
            </Text>

            {uploads.length > 0 && (
              <View style={{ gap: 8, marginBottom: 10 }}>
                {uploads.map((upload, index) => {
                  const res = fileResults?.[index]
                  const isSuccess = res?.status === 'success'
                  const isDuplicate = res?.status === 'duplicate'
                  const isHeaderError = res?.status === 'header_not_found'
                  const isError = res?.status === 'error'
                  const hasResult = !!res

                  const borderColor = isSuccess ? colors.accent
                    : isDuplicate ? '#9A8030'
                    : (isHeaderError || isError) ? colors.neg
                    : colors.hairline

                  const bgColor = isSuccess ? colors.accentSoft
                    : isDuplicate ? '#F5F0DC'
                    : (isHeaderError || isError) ? colors.negSoft
                    : colors.surface

                  const statusLabel = isSuccess
                    ? `${(res as { status: 'success'; transactions: ExtractedTransaction[] }).transactions.filter(t => !t.skipped).length} transações extraídas`
                    : isDuplicate ? 'Já enviado anteriormente'
                    : isHeaderError ? 'Sem cabeçalho de data visível'
                    : isError ? 'Erro ao processar'
                    : upload.format.toUpperCase()

                  return (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        padding: 12, borderRadius: 14,
                        borderWidth: 1, borderColor, backgroundColor: bgColor, gap: 10,
                      }}
                    >
                      <View style={{
                        width: 32, height: 32, borderRadius: 8,
                        backgroundColor: isSuccess ? colors.accent : isDuplicate ? '#9A8030' : colors.hairline,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSuccess
                          ? <Icon.Check size={14} color="#fff" sw={2.5} />
                          : <Icon.Upload size={14} color={colors.muted} sw={1.8} />
                        }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }} numberOfLines={1}>
                          {upload.fileName}
                        </Text>
                        <Text style={{ fontSize: 11, color: hasResult ? borderColor : colors.muted, marginTop: 1 }}>
                          {statusLabel}
                        </Text>
                      </View>
                      {!allDone && (
                        <Pressable
                          onPress={() => removeUpload(index)}
                          hitSlop={8}
                          style={{
                            width: 24, height: 24, borderRadius: 12,
                            backgroundColor: colors.hairline,
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Icon.X size={12} color={colors.muted} sw={2} />
                        </Pressable>
                      )}
                    </View>
                  )
                })}
              </View>
            )}

            {!allDone && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={pickImage}
                  style={{
                    flex: 1, borderRadius: 14, paddingVertical: 13,
                    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }}>+ Imagens</Text>
                </Pressable>
                <Pressable
                  onPress={pickDocument}
                  style={{
                    flex: 1, borderRadius: 14, paddingVertical: 13,
                    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
                    alignItems: 'center',
                  }}
                >
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
                <View style={{
                  width: 48, height: 48, borderRadius: 14,
                  backgroundColor: colors.hairline, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon.Upload size={22} color={colors.muted} sw={1.8} />
                </View>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>
                    Nenhum arquivo selecionado
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    Aceita imagens, PDF, CSV, XLS e XLSX
                  </Text>
                </View>
              </View>
            )}
          </View>

          {selectionError && (
            <Text style={{ fontSize: 13, color: colors.neg, textAlign: 'center' }}>
              {selectionError}
            </Text>
          )}

          {/* Botão enviar */}
          {!allDone && (
            <Pressable
              onPress={() => mutation.mutate()}
              disabled={!canSend}
              style={{
                borderRadius: 18, paddingVertical: 16,
                backgroundColor: canSend ? colors.ink : colors.hairline,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {mutation.isPending
                ? <ActivityIndicator size="small" color="#FBFAF6" />
                : <Icon.Upload size={16} color={canSend ? '#FBFAF6' : colors.muted} sw={2} />
              }
              <Text style={{ fontSize: 15, fontWeight: '500', color: canSend ? '#FBFAF6' : colors.muted }}>
                {mutation.isPending
                  ? 'Analisando...'
                  : uploads.length > 1
                    ? `Analisar ${uploads.length} arquivos`
                    : 'Analisar extrato'
                }
              </Text>
            </Pressable>
          )}

          {/* Lista de transações extraídas */}
          {allDone && allTransactions.length > 0 && (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 4 }}>
                <Text style={{
                  fontSize: 11, fontWeight: '500', color: colors.muted,
                  textTransform: 'uppercase', letterSpacing: 0.8,
                }}>
                  Transações encontradas
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>
                  {allTransactions.length}{skippedCount > 0 ? ` · ${skippedCount} ignoradas` : ''}
                </Text>
              </View>

              <View style={{
                borderRadius: 16, borderWidth: 1, borderColor: colors.hairline,
                backgroundColor: colors.surface, overflow: 'hidden',
              }}>
                {allTransactions.map((t, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 13,
                      borderBottomWidth: i < allTransactions.length - 1 ? 1 : 0,
                      borderBottomColor: colors.hairline,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }} numberOfLines={1}>
                          {t.title}
                        </Text>
                        {t.date_inferred && (
                          <View style={{
                            paddingHorizontal: 5, paddingVertical: 1,
                            backgroundColor: '#F5F0DC', borderRadius: 4,
                          }}>
                            <Text style={{ fontSize: 9, color: '#9A8030', fontWeight: '600' }}>DATA?</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>
                        {t.description}{t.payment_method ? ` · ${t.payment_method}` : ''}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.muted }}>
                        {formatDate(t.date)} · {t.time}
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 15, fontWeight: '600',
                      color: t.type === 'income' ? colors.pos : colors.neg,
                    }}>
                      {formatAmount(t.amount, t.type)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {allDone && allTransactions.length === 0 && (
            <View style={{
              borderRadius: 16, padding: 24,
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline,
              alignItems: 'center', gap: 8,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>
                Nenhuma transação encontrada
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>
                Verifique se a imagem mostra a lista de atividades com datas visíveis.
              </Text>
            </View>
          )}

          {allDone && (
            <Pressable
              onPress={() => {
                setUploads([])
                setFileResults(null)
                mutation.reset()
              }}
              style={{
                borderRadius: 18, paddingVertical: 14,
                borderWidth: 1.5, borderColor: colors.hairline,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.muted }}>
                Analisar outras imagens
              </Text>
            </Pressable>
          )}

        </View>
      </ScrollView>
    </View>
  )
}
