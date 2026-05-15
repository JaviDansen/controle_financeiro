import { useQuery } from "@tanstack/react-query"; // Importa o hook principal do React Query responsável pelas queries assíncronas.

import {
  getCardsSummary,
  getDashboardSummary,
  getLatestTransactions,
} from "../services/dashboard.service"; // Importa as funções do service que simulam a API do dashboard.

export function useDashboard() { // Hook customizado responsável por centralizar toda a lógica de dados da Home.

  const summaryQuery = useQuery({ // Query responsável pelo resumo financeiro principal.
    queryKey: ["dashboard-summary"], // Chave única usada pelo React Query para identificar e cachear essa query.
    queryFn: getDashboardSummary, // Função executada para buscar os dados do resumo.
    staleTime: 1000 * 60 * 5, // Mantém os dados "fresh" por 5 minutos.
  });

  const transactionsQuery = useQuery({ // Query responsável pelas últimas transações.
    queryKey: ["latest-transactions"], // Identificador único das transações recentes.
    queryFn: getLatestTransactions, // Função que busca as transações mockadas.
    staleTime: 1000 * 60 * 2, // Dados considerados fresh por 2 minutos.
  });

  const cardsQuery = useQuery({ // Query responsável pelo resumo dos cartões.
    queryKey: ["cards-summary"], // Chave única da query dos cartões.
    queryFn: getCardsSummary, // Função que busca os dados mockados dos cartões.
    staleTime: 1000 * 60 * 5, // Cache válido por 5 minutos.
  });

  return { // Retorna todos os dados organizados para consumo da Home.
    summary: summaryQuery.data, // Dados do resumo financeiro.
    transactions: transactionsQuery.data, // Lista das transações recentes.
    cards: cardsQuery.data, // Lista dos cartões.

    isLoading: // Indica se alguma query ainda está carregando.
      summaryQuery.isLoading ||
      transactionsQuery.isLoading ||
      cardsQuery.isLoading,

    isError: // Indica se alguma query apresentou erro.
      summaryQuery.isError ||
      transactionsQuery.isError ||
      cardsQuery.isError,
  };

}