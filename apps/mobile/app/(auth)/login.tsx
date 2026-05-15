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
import { Feather } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'
import * as authService from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'

/* ─── Design tokens ─────────────────────────────────────── */
const C = {
  bg: '#ECE7DC',
  surface: '#FBFAF6',
  ink: '#15151A',
  ink2: '#3B3B43',
  muted: '#8B8B92',
  hairline: 'rgba(21,21,26,0.1)',
  accent: '#3F8C5C',
}

/* ─── Validação ─────────────────────────────────────────── */
const schema = z.object({
  email: z.string().min(1, 'E-mail obrigatório').email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type Fields = { email: string; password: string }
type Errors = Partial<Fields & { api: string }>

/* ─── Wordmark ──────────────────────────────────────────── */
function FinAppMark() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      <Text style={{ fontSize: 36, fontWeight: '600', color: C.ink, letterSpacing: -1.8, lineHeight: 40 }}>
        fin
      </Text>
      <View style={{
        width: 7, height: 7, borderRadius: 4,
        backgroundColor: C.accent,
        marginBottom: 7, marginHorizontal: 2,
      }} />
      <Text style={{ fontSize: 36, fontWeight: '600', color: C.ink, letterSpacing: -1.8, lineHeight: 40 }}>
        app
      </Text>
    </View>
  )
}

/* ─── Field ─────────────────────────────────────────────── */
type FieldProps = {
  label: string
  placeholder: string
  value: string
  onChangeText: (v: string) => void
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address'
  autoCapitalize?: 'none' | 'words'
  icon: keyof typeof Feather.glyphMap
  trailing?: React.ReactNode
  error?: string
}

function Field({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType = 'default', autoCapitalize = 'none', icon, trailing, error }: FieldProps) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, fontWeight: '500', color: C.muted, letterSpacing: 0.3, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: error ? '#C0392B' : focused ? C.ink : C.hairline,
        borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 14,
      }}>
        <Feather name={icon} size={18} color={C.muted} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={{ flex: 1, fontSize: 16, color: C.ink, padding: 0 }}
        />
        {trailing}
      </View>
      {error ? <Text style={{ fontSize: 12, color: '#C0392B', marginLeft: 2 }}>{error}</Text> : null}
    </View>
  )
}

/* ─── Checkbox ──────────────────────────────────────────── */
function Checkbox({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{
        width: 18, height: 18, borderRadius: 5,
        borderWidth: 1.5,
        borderColor: checked ? C.accent : C.hairline,
        backgroundColor: checked ? C.accent : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <Feather name="check" size={11} color="#fff" strokeWidth={3} />}
      </View>
      <Text style={{ fontSize: 13, color: C.ink2 }}>{label}</Text>
    </Pressable>
  )
}

/* ─── Login Screen ──────────────────────────────────────── */
export default function LoginScreen() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const [fields, setFields] = useState<Fields>({ email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(true)
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
      setErrors({ email: flat.email?.[0], password: flat.password?.[0] })
      return
    }
    setLoading(true)
    setErrors({})
    try {
      const { user, token } = await authService.login(fields)
      await setUser(user, token)
      router.replace('/(tabs)')
    } catch (err: unknown) {
      setErrors({ api: err instanceof Error ? err.message : 'Erro ao entrar' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero / brand area */}
          <View style={{ padding: 28, paddingTop: 36, gap: 18 }}>
            <FinAppMark />
            <View style={{ gap: 8, marginTop: 28 }}>
              <Text style={{
                fontSize: 34, fontWeight: '500', color: C.ink,
                letterSpacing: -1.2, lineHeight: 38,
              }}>
                Bem-vindo{'\n'}de volta.
              </Text>
              <Text style={{ fontSize: 15, color: C.ink2, lineHeight: 22 }}>
                Entre para retomar o controle das suas finanças.
              </Text>
            </View>
          </View>

          {/* Form card */}
          <View style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 48,
            gap: 18,
            shadowColor: C.ink,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 20,
            elevation: 8,
          }}>
            <Field
              label="E-mail"
              placeholder="e-mail"
              value={fields.email}
              onChangeText={set('email')}
              keyboardType="email-address"
              icon="mail"
              error={errors.email}
            />

            <Field
              label="Senha"
              placeholder="senha"
              value={fields.password}
              onChangeText={set('password')}
              secureTextEntry={!showPwd}
              icon="lock"
              error={errors.password}
              trailing={
                <Pressable onPress={() => setShowPwd(!showPwd)} style={{ padding: 4 }}>
                  <Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={C.muted} />
                </Pressable>
              }
            />

            {/* Lembrar + Esqueci */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <Checkbox checked={remember} onPress={() => setRemember(!remember)} label="Manter conectado" />
              <Link href="/(auth)/forgot-password" style={{ fontSize: 13, color: C.ink, fontWeight: '500', textDecorationLine: 'underline' }}>
                Esqueci a senha
              </Link>
            </View>

            {/* Erro API */}
            {errors.api ? (
              <View style={{ backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12 }}>
                <Text style={{ fontSize: 13, color: '#991B1B' }}>{errors.api}</Text>
              </View>
            ) : null}

            {/* Botão Entrar */}
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.75}
              style={{
                height: 56,
                borderRadius: 16,
                backgroundColor: C.ink,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginTop: 10,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color={C.surface} />
              ) : (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: C.surface, letterSpacing: -0.3 }}>
                    Entrar
                  </Text>
                  <Feather name="chevron-right" size={16} color={C.surface} />
                </>
              )}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: C.hairline }} />
              <Text style={{ fontSize: 12, color: C.muted }}>ou</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: C.hairline }} />
            </View>

            {/* Google */}
            <TouchableOpacity
              activeOpacity={0.75}
              style={{
                height: 52, borderRadius: 14,
                borderWidth: 1, borderColor: C.hairline,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <View style={{
                width: 18, height: 18, borderRadius: 4,
                backgroundColor: C.ink,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.surface }}>G</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '500', color: C.ink }}>Continuar com Google</Text>
            </TouchableOpacity>

            {/* Criar conta */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 4 }}>
              <Text style={{ fontSize: 13, color: C.ink2 }}>Não tem conta? </Text>
              <Link href="/(auth)/register" style={{ fontSize: 13, color: C.ink, fontWeight: '500', textDecorationLine: 'underline' }}>
                Criar conta
              </Link>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}
