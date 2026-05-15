// Static data used by the Live Server prototype.

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const shortDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
});

const DATA = {
  user: {
    name: 'Javi',
    greeting: 'Boa tarde',
  },
  summary: {
    totalIncome: 8250,
    totalExpenses: 4384.72,
    balance: 3865.28,
    monthLabel: 'Maio 2026',
  },
  transactions: [
    { id: 't1', title: 'Cliente Nery Automa', category: 'Receita', date: '2026-05-15', amount: 3200, type: 'income' },
    { id: 't2', title: 'Mercado Mateus', category: 'Mercado', date: '2026-05-14', amount: 286.79, type: 'expense' },
    { id: 't3', title: 'Uber', category: 'Transporte', date: '2026-05-13', amount: 34.9, type: 'expense' },
    { id: 't4', title: 'iFood', category: 'Alimentacao', date: '2026-05-12', amount: 72.5, type: 'expense' },
    { id: 't5', title: 'Projeto landing page', category: 'Receita', date: '2026-05-10', amount: 1850, type: 'income' },
  ],
  cards: [
    {
      id: 'c1',
      name: 'Nubank Platinum',
      brand: 'Mastercard',
      gradient: 'var(--card-grad-2)',
      lastFour: '4821',
      currentMonthTotal: 1840.7,
      limit: 6500,
      openInstallmentsCount: 8,
      openInstallmentsTotal: 3290.2,
      closingDay: 22,
      bestPurchaseDay: 23,
    },
    {
      id: 'c2',
      name: 'Inter Black',
      brand: 'Visa',
      gradient: 'var(--card-grad-1)',
      lastFour: '0914',
      currentMonthTotal: 904.12,
      limit: 5000,
      openInstallmentsCount: 3,
      openInstallmentsTotal: 1410,
      closingDay: 18,
      bestPurchaseDay: 19,
    },
    {
      id: 'c3',
      name: 'XP Controle',
      brand: 'Visa',
      gradient: 'var(--card-grad-3)',
      lastFour: '7702',
      currentMonthTotal: 312.5,
      limit: 2500,
      openInstallmentsCount: 1,
      openInstallmentsTotal: 299.9,
      closingDay: 8,
      bestPurchaseDay: 9,
    },
  ],
};

Object.assign(window, { DATA, money, shortDate });
