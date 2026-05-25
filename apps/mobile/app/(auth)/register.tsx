import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { z } from 'zod';
import * as authService from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';

// Validação Zod alinhada com os testes do TDD
const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .refine(
      (value) => value.trim().split(/\s+/).filter(Boolean).length >= 2,
      'Informe nome e sobrenome'
    ),
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPwd, setShowPwd] = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);
  const [accept, setAccept] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    try {
      setError('');
      registerSchema.parse({ name, email, password, confirmPassword });
      setLoading(true);
      await authService.register(name, email, password);
      const { token, user } = await authService.login(email, password);
      useAuthStore.getState().setToken(token);
      useAuthStore.getState().setUser(user);
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro ao criar a conta');
      }
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-[#ECE7DC]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-1 pt-12">
          
          {/* Header */}
          <View className="px-7 pt-4 pb-4 flex-row items-center gap-3">
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity className="w-10 h-10 rounded-full bg-[#FBFAF6] border border-[#1515151A] items-center justify-center">
                <Feather name="chevron-left" size={18} color="#15151A" />
              </TouchableOpacity>
            </Link>
            <View className="flex-row items-baseline">
              <Text className="text-xl font-semibold tracking-tighter text-[#15151A]">fin</Text>
              <View className="w-1.5 h-1.5 rounded-full bg-[#10b981] mx-0.5 self-end mb-1" />
              <Text className="text-xl font-semibold tracking-tighter text-[#15151A]">app</Text>
            </View>
          </View>

          {/* Title Area */}
          <View className="px-7 pt-2 pb-6 flex-col gap-2">
            <Text className="text-3xl leading-tight font-medium tracking-tight text-[#15151A]">
              Criar sua conta
            </Text>
            <Text className="text-[15px] text-[#3B3B43] max-w-[280px]">
              Leva menos de um minuto. Comece a registrar suas transações agora mesmo.
            </Text>
          </View>

          {/* Form Card */}
          <View className="flex-1 bg-[#FBFAF6] rounded-t-[28px] px-6 pt-8 pb-7 shadow-sm">
            {error ? (
              <Text className="text-red-500 mb-4 text-sm font-medium">{error}</Text>
            ) : null}

            {/* Campo Nome */}
            <View className="flex-col gap-1.5 mb-4">
              <Text className="text-xs font-medium text-[#8B8B92] tracking-wider uppercase">Nome completo</Text>
              <View className="flex-row items-center gap-2.5 bg-[#FBFAF6] border border-[#1515151A] rounded-2xl px-3.5 h-14">
                <Feather name="user" size={18} color="#8B8B92" />
                <TextInput
                  className="flex-1 text-base text-[#15151A]"
                  value={name}
                  onChangeText={setName}
                  placeholder="Nome"
                  placeholderTextColor="#8B8B92"
                  autoCapitalize="words"
                />
              </View>
            </View>

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
                  placeholder="Senha"
                  placeholderTextColor="#8B8B92"
                  secureTextEntry={!showPwd}
                />
                <TouchableOpacity onPress={() => setShowPwd(!showPwd)} className="p-1">
                  <Feather name={showPwd ? "eye-off" : "eye"} size={18} color="#8B8B92" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Campo Confirmar Senha */}
            <View className="flex-col gap-1.5 mb-4">
              <Text className="text-xs font-medium text-[#8B8B92] tracking-wider uppercase">Confirmar senha</Text>
              <View className="flex-row items-center gap-2.5 bg-[#FBFAF6] border border-[#1515151A] rounded-2xl px-3.5 h-14">
                <Feather name="lock" size={18} color="#8B8B92" />
                <TextInput
                  className="flex-1 text-base text-[#15151A]"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmar senha"
                  placeholderTextColor="#8B8B92"
                  secureTextEntry={!showConfPwd}
                />
                <TouchableOpacity onPress={() => setShowConfPwd(!showConfPwd)} className="p-1">
                  <Feather name={showConfPwd ? "eye-off" : "eye"} size={18} color="#8B8B92" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Termos de uso */}
            <View className="flex-row items-start gap-2.5 mt-2 mb-6 pr-4">
              <TouchableOpacity onPress={() => setAccept(!accept)} className="mt-0.5" activeOpacity={0.7}>
                <View className={`w-4 h-4 rounded border justify-center items-center ${accept ? 'bg-[#10b981] border-[#10b981]' : 'border-[#1515151A]'}`}>
                  {accept && <Feather name="check" size={10} color="#fff" />}
                </View>
              </TouchableOpacity>
              <Text className="text-[13px] text-[#3B3B43] leading-relaxed flex-1">
                Eu li e aceito os <Text className="font-medium text-[#15151A] underline">Termos de uso</Text> e a <Text className="font-medium text-[#15151A] underline">Política de privacidade</Text>
              </Text>
            </View>

            {/* Botão Cadastrar */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cadastrar"
              onPress={submit}
              disabled={loading}
              className={`h-14 rounded-2xl bg-[#15151A] flex-row items-center justify-center gap-2 active:scale-[0.97] transition-transform ${loading ? 'opacity-70' : 'opacity-100'}`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-white text-base font-medium">Cadastrar</Text>
                  <Feather name="chevron-right" size={16} color="#fff" />
                </>
              )}
            </Pressable>

            {/* Footer - Login */}
            <View className="flex-row justify-center items-center mt-6 pb-4">
              <Text className="text-[13px] text-[#3B3B43]">Já tem conta? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-[13px] text-[#15151A] font-medium underline">Entrar</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
