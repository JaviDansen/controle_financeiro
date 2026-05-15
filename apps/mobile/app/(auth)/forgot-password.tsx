import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { z } from 'zod'
import * as authService from '@/services/auth.service'

const schema = z.object({
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
})

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const result = schema.safeParse({ email })
    if (!result.success) {
      setError(result.error.flatten().fieldErrors.email?.[0])
      return
    }

    setLoading(true)
    setError(undefined)
    try {
      const { message } = await authService.forgotPassword({ email })
      setSuccess(message)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#E1DBCB' }}
    >
      <View style={{ paddingTop: 64, paddingHorizontal: 24, paddingBottom: 32 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, color: '#8B8B92' }}>← Voltar</Text>
        </Pressable>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#15151A', letterSpacing: -0.8 }}>
          Recuperar senha
        </Text>
        <Text style={{ fontSize: 15, color: '#8B8B92', marginTop: 6 }}>
          Enviaremos um link para seu e-mail
        </Text>
      </View>

      <View style={{
        flex: 1,
        backgroundColor: '#ECE7DC',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 36,
        paddingBottom: 48,
      }}>
        {success ? (
          <View style={{
            backgroundColor: '#FBFAF6',
            borderRadius: 14,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1.5,
            borderColor: '#3F8C5C',
          }}>
            <Text style={{ fontSize: 15, color: '#15151A', lineHeight: 22 }}>{success}</Text>
          </View>
        ) : (
          <>
            <View style={{ marginBottom: 28 }}>
              <Text style={labelStyle}>E-mail</Text>
              <TextInput
                placeholder="e-mail"
                placeholderTextColor="#8B8B92"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(undefined) }}
                style={[inputStyle, error ? inputErrorStyle : null]}
              />
              {error ? <Text style={errorStyle}>{error}</Text> : null}
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.75}
              style={{
                backgroundColor: '#15151A',
                borderRadius: 16,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? <ActivityIndicator color="#FBFAF6" />
                : <Text style={{ fontSize: 16, fontWeight: '500', color: '#FBFAF6', letterSpacing: -0.3 }}>
                    Enviar
                  </Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const labelStyle = {
  fontSize: 12,
  fontWeight: '600' as const,
  color: '#8B8B92',
  letterSpacing: 0.4,
  textTransform: 'uppercase' as const,
  marginBottom: 6,
}

const inputStyle = {
  backgroundColor: '#FBFAF6',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 15,
  color: '#15151A',
  borderWidth: 1.5,
  borderColor: '#DDD7C8',
}

const inputErrorStyle = {
  borderColor: '#C0392B',
}

const errorStyle = {
  fontSize: 12,
  color: '#C0392B',
  marginTop: 4,
  marginLeft: 2,
}
