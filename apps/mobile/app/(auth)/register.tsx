import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useRouter, Link } from 'expo-router'
import { z } from 'zod'
import * as authService from '@/services/auth.service'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  password: z.string().min(6, 'Senha mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
})

type Fields = { name: string; email: string; password: string; confirmPassword: string }
type Errors = Partial<Fields & { api: string }>

export default function RegisterScreen() {
  const router = useRouter()
  const [fields, setFields] = useState<Fields>({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  function set(key: keyof Fields) {
    return (value: string) => {
      setFields((prev) => ({ ...prev, [key]: value }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  async function handleSubmit() {
    const result = schema.safeParse(fields)
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors
      const formErrors = result.error.flatten().formErrors
      setErrors({
        name: flat.name?.[0],
        email: flat.email?.[0],
        password: flat.password?.[0],
        confirmPassword: flat.confirmPassword?.[0] ?? formErrors[0],
      })
      return
    }

    setLoading(true)
    setErrors({})
    try {
      await authService.register({
        name: fields.name,
        email: fields.email,
        password: fields.password,
      })
      router.replace('/(auth)/login')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar'
      setErrors({ api: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#E1DBCB' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 64, paddingBottom: 32, paddingHorizontal: 24 }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, color: '#8B8B92' }}>← Voltar</Text>
          </Pressable>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#15151A', letterSpacing: -0.8 }}>
            Criar conta
          </Text>
          <Text style={{ fontSize: 15, color: '#8B8B92', marginTop: 6 }}>
            Comece a controlar suas finanças
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
          <View style={{ marginBottom: 12 }}>
            <Text style={labelStyle}>Nome</Text>
            <TextInput
              placeholder="nome"
              placeholderTextColor="#8B8B92"
              autoCapitalize="words"
              value={fields.name}
              onChangeText={set('name')}
              style={[inputStyle, errors.name ? inputErrorStyle : null]}
            />
            {errors.name ? <Text style={errorStyle}>{errors.name}</Text> : null}
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={labelStyle}>E-mail</Text>
            <TextInput
              placeholder="e-mail"
              placeholderTextColor="#8B8B92"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={fields.email}
              onChangeText={set('email')}
              style={[inputStyle, errors.email ? inputErrorStyle : null]}
            />
            {errors.email ? <Text style={errorStyle}>{errors.email}</Text> : null}
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={labelStyle}>Senha</Text>
            <TextInput
              placeholder="senha"
              placeholderTextColor="#8B8B92"
              secureTextEntry
              value={fields.password}
              onChangeText={set('password')}
              style={[inputStyle, errors.password ? inputErrorStyle : null]}
            />
            {errors.password ? <Text style={errorStyle}>{errors.password}</Text> : null}
          </View>

          <View style={{ marginBottom: 28 }}>
            <Text style={labelStyle}>Confirmar senha</Text>
            <TextInput
              placeholder="confirmar senha"
              placeholderTextColor="#8B8B92"
              secureTextEntry
              value={fields.confirmPassword}
              onChangeText={set('confirmPassword')}
              style={[inputStyle, errors.confirmPassword ? inputErrorStyle : null]}
            />
            {errors.confirmPassword ? <Text style={errorStyle}>{errors.confirmPassword}</Text> : null}
          </View>

          {errors.api ? (
            <View style={{ backgroundColor: '#DDD7C8', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: '#15151A' }}>{errors.api}</Text>
            </View>
          ) : null}

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
                  Cadastrar
                </Text>
            }
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 28 }}>
            <Text style={{ fontSize: 14, color: '#8B8B92' }}>Já tem conta? </Text>
            <Link href="/(auth)/login" style={{ fontSize: 14, color: '#15151A', fontWeight: '600' }}>
              Entrar
            </Link>
          </View>
        </View>
      </ScrollView>
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
