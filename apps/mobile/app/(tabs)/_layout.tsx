import { Slot } from "expo-router"; // Importa o Slot responsável por renderizar as rotas filhas do Expo Router.

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"; // Importa o cliente e provider do React Query.

const queryClient = new QueryClient(); // Cria a instância global do React Query responsável por cache e gerenciamento das queries.

export default function RootLayout() { // Layout raiz da aplicação mobile.
  return (
    <QueryClientProvider client={queryClient}> {/* Provider global do React Query. */}
      <Slot /> {/* Renderiza as rotas filhas da aplicação. */}
    </QueryClientProvider>
  );
}