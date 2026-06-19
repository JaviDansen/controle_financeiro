import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Icon } from '../../src/components/ui/Icon';
import { colors } from '../../src/theme/colors';
import { useAuthStore } from '../../store/auth.store';
import { sendExtractImage, DuplicateImageError } from '../../services/import.service';

const BANKS = [
  { id: 'mercadopago', label: 'Mercado Pago' },
] as const

type BankId = typeof BANKS[number]['id']

export default function ImportExtractScreen() {
  const router = useRouter()
  const token = useAuthStore(s => s.token)
  const statusBarHeight = StatusBar.currentHeight ?? 0

  const [selectedBank, setSelectedBank] = useState<BankId>('mercadopago')
  const [imageName, setImageName] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [result, setResult] = useState<'success' | 'duplicate' | null>(null)

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      return
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
    })

    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0]
      setImageBase64(asset.base64 ?? null)
      setImageName(asset.fileName ?? 'imagem-selecionada.jpg')
      setResult(null)
    }
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (!imageBase64 || !token) throw new Error('Dados incompletos')
      return sendExtractImage(imageBase64, selectedBank, token)
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

  const canSend = !!imageBase64 && !mutation.isPending && result === null

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
              Envie uma screenshot do seu banco
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
              Imagem do extrato
            </Text>
            <Pressable
              onPress={pickImage}
              style={{
                borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
                borderColor: imageBase64 ? colors.ink : colors.hairline,
                backgroundColor: colors.surface,
                padding: 24,
                alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: imageBase64 ? colors.ink : colors.hairline,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon.Upload size={22} color={imageBase64 ? '#FBFAF6' : colors.muted} sw={1.8} />
              </View>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink }}>
                  {imageName ?? 'Selecionar imagem'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {imageBase64 ? 'Toque para trocar' : 'Toque para abrir a galeria'}
                </Text>
              </View>
            </Pressable>
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
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1E5229' }}>Extrato recebido!</Text>
                <Text style={{ fontSize: 12, color: '#3D8B4E', marginTop: 2 }}>
                  Imagem salva com sucesso. Em breve as transações serão extraídas.
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
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#5A4A10' }}>Imagem duplicada</Text>
                <Text style={{ fontSize: 12, color: '#9A8030', marginTop: 2 }}>
                  Este extrato já foi enviado anteriormente. Selecione uma imagem diferente.
                </Text>
              </View>
            </View>
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
