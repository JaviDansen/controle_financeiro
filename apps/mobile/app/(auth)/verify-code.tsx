import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as authService from '../../services/auth.service';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const { email, fromProfile } = useLocalSearchParams<{ email: string; fromProfile?: string }>();

  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Foca no primeiro input ao carregar a tela
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  const verify = async (codeString: string) => {
    try {
      setError('');
      setLoading(true);

      if (!email) {
        throw new Error('E-mail não informado.');
      }

      // Chamada real à API
      const result = await authService.verifyCode(email, codeString);

      // Avança para a tela de resetar a senha passando o token real
      router.push({
        pathname: '/(auth)/reset-password',
        params: { token: result.token, fromProfile },
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Código inválido ou expirado.');
      }
      // Limpa os campos após falha
      setCode(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleChangeText = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');

    // Trata colagem de código completo de 6 dígitos
    if (cleaned.length === 6) {
      const codeArray = cleaned.split('');
      setCode(codeArray);
      verify(cleaned);
      inputRefs.current[5]?.focus();
      return;
    }

    const digit = cleaned.slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit !== '') {
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        const fullCode = newCode.join('');
        if (fullCode.length === 6) {
          verify(fullCode);
        }
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (code[index] === '' && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    }
  };

  const resendCode = async () => {
    try {
      setError('');
      setResending(true);
      setResendSuccess(false);

      if (!email) {
        throw new Error('E-mail não informado.');
      }

      // Reenviar código chama forgotPassword
      await authService.forgotPassword(email);

      setResendSuccess(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao reenviar o código. Tente novamente.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-[#ECE7DC]">
      <View className="flex-1 pt-16">
        {/* Brand Area */}
        <View className="px-7 pt-9 pb-7 flex-col gap-4">
          <View className="flex-row items-baseline">
            <Text className="text-4xl font-semibold tracking-tighter text-[#15151A]">fin</Text>
            <View className="w-2 h-2 rounded-full bg-[#10b981] mx-1 self-end mb-1.5" />
            <Text className="text-4xl font-semibold tracking-tighter text-[#15151A]">app</Text>
          </View>
          <View className="mt-7 flex-col gap-2">
            <Text className="text-3xl leading-tight font-medium tracking-tight text-[#15151A]">
              Verificação.
            </Text>
            <Text className="text-[15px] text-[#3B3B43] max-w-[280px]">
              Insira o código de 6 dígitos enviado para{'\n'}
              <Text className="font-semibold text-[#15151A]">{email || 'seu e-mail'}</Text>.
            </Text>
          </View>
        </View>

        {/* Card Area */}
        <View className="flex-1 bg-[#FBFAF6] rounded-t-[28px] px-6 pt-8 pb-7 shadow-sm">
          {error ? (
            <Text className="text-red-500 mb-4 text-sm font-medium">{error}</Text>
          ) : null}

          {resendSuccess ? (
            <Text className="text-green-600 mb-4 text-sm font-medium">Novo código enviado com sucesso!</Text>
          ) : null}

          {/* OTP Input Grid */}
          <View className="flex-row justify-between mb-8 mt-2">
            {Array(6)
              .fill(null)
              .map((_, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  className="w-11 h-14 bg-[#FBFAF6] border border-[#1515151A] rounded-2xl text-xl font-semibold text-center text-[#15151A] focus:border-[#10b981]"
                  value={code[index]}
                  onChangeText={(text) => handleChangeText(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={6} // permite 6 para o caso de colagem completa
                  selectTextOnFocus
                  editable={!loading}
                />
              ))}
          </View>

          {/* Loading Indicator */}
          {loading && (
            <View className="flex-row items-center justify-center gap-2 mb-6">
              <ActivityIndicator color="#15151A" size="small" />
              <Text className="text-[14px] text-[#3B3B43]">Verificando código...</Text>
            </View>
          )}

          {/* Resend Action */}
          <View className="flex-row justify-center items-center mb-6">
            <TouchableOpacity
              onPress={resendCode}
              disabled={resending || loading}
              className="py-2 px-4 rounded-xl border border-[#1515151A] active:scale-[0.97]"
            >
              {resending ? (
                <ActivityIndicator color="#15151A" size="small" />
              ) : (
                <Text className="text-[13px] font-medium text-[#15151A]">
                  Reenviar código
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer - Voltar */}
          <View className="flex-row justify-center items-center mt-auto pt-4 pb-4">
            {fromProfile === 'true' ? (
              <TouchableOpacity
                onPress={() => router.replace('/(tabs)/profile')}
                className="flex-row items-center gap-1.5"
              >
                <Feather name="arrow-left" size={14} color="#15151A" />
                <Text className="text-[13px] text-[#15151A] font-medium underline">
                  Cancelar e voltar
                </Text>
              </TouchableOpacity>
            ) : (
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity className="flex-row items-center gap-1.5">
                  <Feather name="arrow-left" size={14} color="#15151A" />
                  <Text className="text-[13px] text-[#15151A] font-medium underline">
                    Alterar e-mail informado
                  </Text>
                </TouchableOpacity>
              </Link>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
