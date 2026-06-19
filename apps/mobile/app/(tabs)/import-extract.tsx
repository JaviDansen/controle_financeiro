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
  type ExtractUploadPayload,
  type ImportFormat,
} from '../../services/import.service';

const BANKS = [
  { id: 'mercadopago', label: 'Mercado Pago' },
] as const

const DOCUMENT_TYPES = [
  'application/pdf',
  'text/csv',
  'application/csv',
  'text/comma-separated-values',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

type BankId = typeof BANKS[number]['id']

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

export default function ImportExtractScreen() {
  const router = useRouter()
  const token = useAuthStore(s => s.token)
  const statusBarHeight = StatusBar.currentHeight ?? 0

  const [selectedBank, setSelectedBank] = useState<BankId>('mercadopago')
  const [selectedUpload, setSelectedUpload] = useState<ExtractUploadPayload | null>(null)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [result, setResult] = useState<'success' | 'duplicate' | null>(null)

  function handleNewSelection(upload: ExtractUploadPayload) {
    setSelectedUpload(upload)
    setSelectionError(null)
    setResult(null)
    mutation.reset()
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setSelectionError('Permita acesso a galeria para selecionar uma imagem.')
      return
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
    })

    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0]
      if (!asset.base64) {
        setSelectionError('Nao foi possivel ler a imagem selecionada.')
        return
      }

      handleNewSelection({
        fileBase64: asset.base64,
        fileName: asset.fileName ?? 'imagem-selecionada.jpg',
        format: 'screenshot',
        mimeType: asset.mimeType,
      })
    }
  }

  async function pickDocument() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: DOCUMENT_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      })

      if (picked.canceled || !picked.assets[0]) return

      const asset = picked.assets[0]
      const format = inferFormat(asset.name, asset.mimeType)

      if (!format) {
        setSelectionError('Formato nao suportado. Use PDF, CSV, XLS ou XLSX.')
        return
      }

      const fileBase64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      handleNewSelection({
        fileBase64,
        fileName: asset.name,
        format,
        mimeType: asset.mimeType,
      })
    } catch {
      setSelectionError('Nao foi possivel ler o arquivo selecionado.')
    }
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedUpload || !token) throw new Error('Dados incompletos')
      return sendExtractFile(selectedUpload, selectedBank, token)
    },
    onSuccess: () => {
      setResult('success')
    },
    onError: (err) => {
      if (err instanceof DuplicateImageError) {
        setResult('duplicate')
      }
    },
  })

  const canSend = !!selectedUpload && !mutation.isPending && result === null

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

        <View style={{ paddingHorizontal: 16, gap: 16 }}>

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
                      padding: 16, borderRadius: 16,
                      borderWidth: 1.5,
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

          {/* Área de upload */}
          <View>
            <Text style={{
              fontSize: 11, fontWeight: '500', color: colors.muted,
              textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4,
            }}>
              Arquivo do extrato
            </Text>
            <Pressable
              onPress={pickDocument}
              style={{
                borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
                borderColor: selectedUpload ? colors.ink : colors.hairline,
                backgroundColor: colors.surface,
                padding: 24,
                alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: selectedUpload ? colors.ink : colors.hairline,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon.Upload size={22} color={selectedUpload ? '#FBFAF6' : colors.muted} sw={1.8} />
              </View>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>
                  {selectedUpload?.fileName ?? 'Selecionar arquivo'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {selectedUpload
                    ? 'Toque para trocar o arquivo selecionado'
                    : 'Aceita imagem, PDF, CSV, XLS e XLSX'}
                </Text>
              </View>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Pressable
                onPress={pickImage}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  paddingVertical: 13,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }}>
                  Selecionar imagem
                </Text>
              </Pressable>

              <Pressable
                onPress={pickDocument}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  paddingVertical: 13,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.ink }}>
                  Selecionar arquivo
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Feedback */}
          {result === 'success' && (
            <View style={{
              borderRadius: 16, padding: 16,
              backgroundColor: '#DDF0E4', borderWidth: 1, borderColor: '#3D8B4E',
              flexDirection: 'row', alignItems: 'center', gap: 10,
            }}>
              <Icon.Check size={16} color="#1E5229" sw={2.5} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E5229' }}>Arquivo recebido!</Text>
                <Text style={{ fontSize: 12, color: '#3D8B4E', marginTop: 2 }}>
                  Arquivo salvo com sucesso. Em breve as transacoes serao extraidas.
                </Text>
              </View>
            </View>
          )}

          {result === 'duplicate' && (
            <View style={{
              borderRadius: 16, padding: 16,
              backgroundColor: '#F5F0DC', borderWidth: 1, borderColor: '#9A8030',
              flexDirection: 'row', alignItems: 'center', gap: 10,
            }}>
              <Icon.Filter size={16} color="#5A4A10" sw={2} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#5A4A10' }}>Arquivo duplicado</Text>
                <Text style={{ fontSize: 12, color: '#9A8030', marginTop: 2 }}>
                  Este arquivo ja foi enviado anteriormente. Selecione outro arquivo.
                </Text>
              </View>
            </View>
          )}

          {selectionError && (
            <Text style={{ fontSize: 13, color: colors.neg, textAlign: 'center' }}>
              {selectionError}
            </Text>
          )}

          {mutation.isError && result === null && (
            <Text style={{ fontSize: 13, color: colors.neg, textAlign: 'center' }}>
              {(mutation.error as Error)?.message ?? 'Erro ao enviar. Tente novamente.'}
            </Text>
          )}

          {/* Botão enviar */}
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
              {mutation.isPending ? 'Enviando...' : 'Enviar extrato'}
            </Text>
          </Pressable>

          {result === 'success' && (
            <Pressable
              onPress={() => router.back()}
              style={{
                borderRadius: 18, paddingVertical: 14,
                borderWidth: 1.5, borderColor: colors.hairline,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.muted }}>Voltar para transações</Text>
            </Pressable>
          )}

        </View>
      </ScrollView>
    </View>
  )
}
