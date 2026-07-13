import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../store/auth.store';

export default function RootLayout() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hasHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 30_000,
            gcTime: 5 * 60_000,
          },
          mutations: { retry: false },
        },
      })
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    // Ao trocar de usuário (logout ou login), limpa o cache do React Query —
    // sem isso, dados do usuário anterior (transactions, cards, categories)
    // ficam servidos do cache até o staleTime expirar.
    queryClient.clear();
    router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
  }, [hydrated, isAuthenticated, router, queryClient]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
