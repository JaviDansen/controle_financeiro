import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { z } from 'zod';

// Validação Zod para o formulário
const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    try {
      setError('');
      forgotPasswordSchema.parse({ email });
      
      setLoading(true);
      
      // TODO: Implementar chamada React Query useMutation para POST /auth/forgot-password
      
      setTimeout(() => {
        setLoading(false);
        setSuccess(true); // Exibe a tela de sucesso
      }, 1000);
      
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError('Ocorreu um erro ao processar a solicitação');
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
              Recuperar{'\n'}senha.
            </Text>
            <Text className="text-[15px] text-[#3B3B43] max-w-[280px]">
              Informe seu e-mail cadastrado e enviaremos instruções para redefinir sua senha.
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View className="flex-1 bg-[#FBFAF6] rounded-t-[28px] px-6 pt-8 pb-7 shadow-sm">
          {success ? (
            <View className="flex-1 justify-center items-center pb-20">
              <View className="w-16 h-16 bg-[#10b981] rounded-full items-center justify-center mb-6">
                <Feather name="check" size={32} color="#fff" />
              </View>
              <Text className="text-xl font-semibold text-[#15151A] mb-2 text-center">E-mail enviado!</Text>
              <Text className="text-[15px] text-[#3B3B43] text-center mb-8 px-4">
                Verifique sua caixa de entrada (e a pasta de spam) para o e-mail <Text className="font-medium">{email}</Text>.
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable className="h-14 w-full rounded-2xl bg-[#15151A] flex-row items-center justify-center gap-2 active:scale-[0.97] transition-transform">
                  <Text className="text-white text-base font-medium">Voltar ao Login</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <>
              {error ? (
                <Text className="text-red-500 mb-4 text-sm font-medium">{error}</Text>
              ) : null}

              {/* Campo E-mail */}
              <View className="flex-col gap-1.5 mb-6">
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

              {/* Botão Enviar */}
              <Pressable onPress={submit} disabled={loading} className={`h-14 rounded-2xl bg-[#15151A] flex-row items-center justify-center gap-2 mt-2 active:scale-[0.97] transition-transform ${loading ? 'opacity-70' : 'opacity-100'}`}>
                {loading ? <ActivityIndicator color="#fff" /> : <><Text className="text-white text-base font-medium">Enviar link de recuperação</Text><Feather name="arrow-right" size={16} color="#fff" /></>}
              </Pressable>

              {/* Footer - Voltar ao login */}
              <View className="flex-row justify-center items-center mt-auto pt-4 pb-4">
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity className="flex-row items-center gap-1.5"><Feather name="arrow-left" size={14} color="#15151A" /><Text className="text-[13px] text-[#15151A] font-medium underline">Voltar para o login</Text></TouchableOpacity>
                </Link>
              </View>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}