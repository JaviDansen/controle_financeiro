import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { z } from 'zod';

// Validação de Zod com base nas regras do seu projeto
const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    try {
      setError('');
      // Valida via Zod antes de qualquer ação
      loginSchema.parse({ email, password });
      
      setLoading(true);
      
      // TODO: Implementar chamada React Query useMutation para POST /auth/login
      // TODO: Salvar JWT no SecureStore e atualizar Zustand auth.store.ts
      
      setTimeout(() => {
        setLoading(false);
        // Placeholder de sucesso
        // router.replace('/(tabs)/home'); 
      }, 1000);
      
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError('Ocorreu um erro ao fazer login');
      }
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-[#ECE7DC]">
      <View className="flex-1 pt-16">
        {/* Hero / Brand Area */}
        <View className="px-7 pt-9 pb-7 flex-col gap-4">
          <View className="flex-row items-baseline">
            <Text className="text-4xl font-semibold tracking-tighter text-[#15151A]">fin</Text>
            <View className="w-2 h-2 rounded-full bg-[#10b981] mx-1 self-end mb-1.5" />
            <Text className="text-4xl font-semibold tracking-tighter text-[#15151A]">app</Text>
          </View>
          <View className="mt-7 flex-col gap-2">
            <Text className="text-3xl leading-tight font-medium tracking-tight text-[#15151A]">
              Bem-vindo{'\n'}de volta.
            </Text>
            <Text className="text-[15px] text-[#3B3B43] max-w-[280px]">
              Entre para retomar o controle das suas finanças deste mês.
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View className="flex-1 bg-[#FBFAF6] rounded-t-[28px] px-6 pt-8 pb-7 shadow-sm">
          {error ? (
            <Text className="text-red-500 mb-4 text-sm font-medium">{error}</Text>
          ) : null}

          {/* Campo E-mail */}
          <View className="flex-col gap-1.5 mb-4">
            <Text className="text-xs font-medium text-[#8B8B92] tracking-wider uppercase">E-mail</Text>
            <View className="flex-row items-center gap-2.5 bg-[#FBFAF6] border border-[#1515151A] rounded-2xl px-3.5 h-14">
              <Feather name="mail" size={18} color="#8B8B92" />
              <TextInput
                className="flex-1 text-base text-[#15151A]"
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#8B8B92"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Campo Senha */}
          <View className="flex-col gap-1.5 mb-4">
            <Text className="text-xs font-medium text-[#8B8B92] tracking-wider uppercase">Senha</Text>
            <View className="flex-row items-center gap-2.5 bg-[#FBFAF6] border border-[#1515151A] rounded-2xl px-3.5 h-14">
              <Feather name="lock" size={18} color="#8B8B92" />
              <TextInput
                className="flex-1 text-base text-[#15151A]"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#8B8B92"
                secureTextEntry={!showPwd}
              />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} className="p-1">
                <Feather name={showPwd ? "eye-off" : "eye"} size={18} color="#8B8B92" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Manter conectado & Esqueci a senha */}
          <View className="flex-row items-center justify-between mt-1 mb-6">
            <TouchableOpacity onPress={() => setRemember(!remember)} className="flex-row items-center gap-2" activeOpacity={0.7}>
              <View className={`w-4 h-4 rounded border justify-center items-center ${remember ? 'bg-[#10b981] border-[#10b981]' : 'border-[#1515151A]'}`}>
                {remember && <Feather name="check" size={10} color="#fff" />}
              </View>
              <Text className="text-[13px] text-[#3B3B43]">Manter conectado</Text>
            </TouchableOpacity>
            
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity>
                <Text className="text-[13px] text-[#15151A] font-medium underline">Esqueci a senha</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Botão Entrar com Feedback Tátil (scale activeOpacity) */}
          <TouchableOpacity
            onPress={submit}
            disabled={loading}
            activeOpacity={0.8}
            className={`h-14 rounded-2xl bg-[#15151A] flex-row items-center justify-center gap-2 mt-2 ${loading ? 'opacity-70' : 'opacity-100'}`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text className="text-white text-base font-medium">Entrar</Text>
                <Feather name="chevron-right" size={16} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Divisor */}
          <View className="flex-row items-center gap-3 my-6">
            <View className="flex-1 h-[1px] bg-[#1515151A]" />
            <Text className="text-xs text-[#8B8B92]">ou</Text>
            <View className="flex-1 h-[1px] bg-[#1515151A]" />
          </View>

          {/* Continuar com Google */}
          <TouchableOpacity activeOpacity={0.7} className="h-[52px] rounded-xl border border-[#1515151A] bg-transparent flex-row items-center justify-center gap-2.5">
            <View className="w-[18px] h-[18px] rounded bg-[#15151A] items-center justify-center">
              <Text className="text-white text-[11px] font-bold">G</Text>
            </View>
            <Text className="text-[15px] font-medium text-[#15151A]">Continuar com Google</Text>
          </TouchableOpacity>

          {/* Footer - Criar conta */}
          <View className="flex-row justify-center items-center mt-auto pt-4 pb-4">
            <Text className="text-[13px] text-[#3B3B43]">Não tem conta? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-[13px] text-[#15151A] font-medium underline">Criar conta</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
