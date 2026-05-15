export type DashboardSummary = { // Exporta o tipo que representa o resumo principal do dashboard.
  totalIncome: number; // Guarda o total de receitas do usuário no período atual.
  totalExpenses: number; // Guarda o total de despesas do usuário no período atual.
  balance: number; // Guarda o saldo final calculado: receitas menos despesas.
};

export type TransactionItem = { // Exporta o tipo que representa uma transação exibida na Home.
  id: string; // Identificador único da transação.
  title: string; // Nome ou descrição curta da transação.
  category: string; // Categoria financeira da transação, como Alimentação ou Transporte.
  date: string; // Data da transação em formato de texto.
  amount: number; // Valor monetário da transação.
  type: "income" | "expense"; // Define se a transação é uma receita ou uma despesa.
};

export type CardSummary = { // Exporta o tipo que representa o resumo de um cartão.
  id: string; // Identificador único do cartão.
  cardName: string; // Nome do cartão exibido para o usuário.
  currentMonthTotal: number; // Total gasto no cartão no mês atual.
  openInstallmentsCount: number; // Quantidade de parcelas ainda abertas.
  openInstallmentsTotal: number; // Valor total das parcelas ainda em aberto.
  closingDay: number; // Dia de fechamento da fatura.
  bestPurchaseDay: number; // Melhor dia de compra do cartão.
};


//Dados mockados
export async function getDashboardSummary(): Promise<DashboardSummary> { // Função assíncrona que simula a busca do resumo financeiro do dashboard.
  return { // Retorna um objeto simulando a resposta futura da API.
    totalIncome: 5000, // Total de receitas mockado.
    totalExpenses: 3200, // Total de despesas mockado.
    balance: 1800, // Saldo mockado.
  };
}

export async function getLatestTransactions(): Promise<TransactionItem[]> { // Função que simula a busca das últimas transações do usuário.
  return [ // Retorna uma lista simulada de transações.
    {
      id: "1", // ID único da transação.
      title: "Salário", // Nome da transação.
      category: "Receita", // Categoria financeira.
      date: "2026-05-15", // Data simulada.
      amount: 5000, // Valor da transação.
      type: "income", // Define como receita.
    },
    {
      id: "2", // ID único da transação.
      title: "Supermercado", // Nome da transação.
      category: "Alimentação", // Categoria financeira.
      date: "2026-05-14", // Data simulada.
      amount: 350, // Valor da transação.
      type: "expense", // Define como despesa.
    },
  ];
}

export async function getCardsSummary(): Promise<CardSummary[]> { // Função que simula a busca do resumo dos cartões do usuário.
  return [ // Retorna uma lista simulada de cartões.
    {
      id: "1", // ID único do cartão.
      cardName: "Nubank", // Nome do cartão.
      currentMonthTotal: 860, // Total gasto no mês atual.
      openInstallmentsCount: 3, // Quantidade de parcelas abertas.
      openInstallmentsTotal: 1200, // Valor total das parcelas restantes.
      closingDay: 10, // Dia de fechamento da fatura.
      bestPurchaseDay: 11, // Melhor dia para compras.
    },
  ];
}