import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { z } from 'zod';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const schema = z.object({
  newPassword: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, {
  message: 'As senhas não conferem',
  path: ['confirm'],
});

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    try {
      setError('');
      schema.parse({ newPassword, confirm });

      if (!token) {
        setError('Link inválido ou expirado.');
        return;
      }

      setLoading(true);
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erro ao redefinir senha');
      setSuccess(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro ao redefinir a senha');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-[#ECE7DC]">
      <View className="flex-1 pt-16">
        <View className="px-7 pt-9 pb-7 flex-col gap-4">
          <View className="flex-row items-baseline">
            <Text className="text-4xl font-semibold tracking-tighter text-[#15151A]">fin</Text>
            <View className="w-2 h-2 rounded-full bg-[#10b981] mx-1 self-end mb-1.5" />
            <Text className="text-4xl font-semibold tracking-tighter text-[#15151A]">app</Text>
          </View>
          <View className="mt-7 flex-col gap-2">
            <Text className="text-3xl leading-tight font-medium tracking-tight text-[#15151A]">
              Nova{'\n'}senha.
            </Text>
            <Text className="text-[15px] text-[#3B3B43] max-w-[280px]">
              Crie uma senha forte com pelo menos 8 caracteres.
            </Text>
          </View>
        </View>

        <View className="flex-1 bg-[#FBFAF6] rounded-t-[28px] px-6 pt-8 pb-7 shadow-sm">
          {success ? (
            <View className="flex-1 justify-center items-center pb-20">
              <View className="w-16 h-16 bg-[#10b981] rounded-full items-center justify-center mb-6">
                <Feather name="check" size={32} color="#fff" />
              </View>
              <Text className="text-xl font-semibold text-[#15151A] mb-2 text-center">Senha redefinida!</Text>
              <Text className="text-[15px] text-[#3B3B43] text-center mb-8 px-4">
                Sua nova senha foi salva com sucesso.
              </Text>
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                className="h-14 w-full rounded-2xl bg-[#15151A] flex-row items-center justify-center gap-2"
              >
                <Text className="text-white text-base font-medium">Fazer login</Text>
                <Feather name="chevron-right" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {error ? <Text className="text-red-500 mb-4 text-sm font-medium">{error}</Text> : null}

              <View className="flex-col gap-1.5 mb-4">
                <Text className="text-xs font-medium text-[#8B8B92] tracking-wider uppercase">Nova senha</Text>
                <View className="flex-row items-center gap-2.5 bg-[#FBFAF6] border border-[#1515151A] rounded-2xl px-3.5 h-14">
                  <Feather name="lock" size={18} color="#8B8B92" />
                  <TextInput
                    className="flex-1 text-base text-[#15151A]"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#8B8B92"
                    secureTextEntry={!showPwd}
                  />
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)} className="p-1">
                    <Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color="#8B8B92" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-col gap-1.5 mb-6">
                <Text className="text-xs font-medium text-[#8B8B92] tracking-wider uppercase">Confirmar senha</Text>
                <View className="flex-row items-center gap-2.5 bg-[#FBFAF6] border border-[#1515151A] rounded-2xl px-3.5 h-14">
                  <Feather name="lock" size={18} color="#8B8B92" />
                  <TextInput
                    className="flex-1 text-base text-[#15151A]"
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="••••••••"
                    placeholderTextColor="#8B8B92"
                    secureTextEntry={!showPwd}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={submit}
                disabled={loading}
                activeOpacity={0.8}
                className={`h-14 rounded-2xl bg-[#15151A] flex-row items-center justify-center gap-2 ${loading ? 'opacity-70' : 'opacity-100'}`}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white text-base font-medium">Redefinir senha</Text>
                    <Feather name="chevron-right" size={16} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-center items-center mt-auto pt-4 pb-4">
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity className="flex-row items-center gap-1.5">
                    <Feather name="arrow-left" size={14} color="#15151A" />
                    <Text className="text-[13px] text-[#15151A] font-medium underline">Voltar para o login</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
