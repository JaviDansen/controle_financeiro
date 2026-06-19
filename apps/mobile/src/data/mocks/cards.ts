import { Card } from '../../types/finance';

export const CARDS: Card[] = [
  {
    id: 'c1', name: 'Roxinho', bank: 'Nubank', type: 'credit', last4: '4218',
    holder: 'WALBER VIDIGAL', expiry: '08/29',
    limit: 8500.00, used: 3247.50,
    closingDay: 16, bestPurchaseDate: '2026-06-19', dueDay: 23,
    openInstallmentsCount: 4, openInstallmentsTotal: 1280.00,
    currentMonthTotal: 1240.00,
    gradientColors: ['#6B2D8C', '#3B0F66'],
    accent: '#C77BF0',
  },
  {
    id: 'c2', name: 'Black', bank: 'Inter', type: 'credit', last4: '0921',
    holder: 'WALBER VIDIGAL', expiry: '02/30',
    limit: 12000.00, used: 1820.30,
    closingDay: 28, bestPurchaseDate: '2026-07-01', dueDay: 5,
    openInstallmentsCount: 2, openInstallmentsTotal: 640.00,
    currentMonthTotal: 820.30,
    gradientColors: ['#1A1A1A', '#0A0A0A'],
    accent: '#FF7A00',
  },
  {
    id: 'c3', name: 'Conta', bank: 'Itaú', type: 'debit', last4: '7740',
    holder: 'WALBER VIDIGAL', expiry: '11/28',
    limit: null, used: 0,
    closingDay: null, bestPurchaseDate: null, dueDay: null,
    openInstallmentsCount: 0, openInstallmentsTotal: 0,
    currentMonthTotal: 0,
    gradientColors: ['#F7610B', '#C44400'],
    accent: '#FFFFFF',
  },
];
