import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

export default function IndexScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // TODO: Quando a tela Home for criada na próxima etapa, usaremos isto:
  // if (isAuthenticated) {
  //   return <Redirect href="/(tabs)/home" />;
  // }

  // Redireciona automaticamente para o fluxo de autenticação
  return <Redirect href="/(auth)/login" />;
}