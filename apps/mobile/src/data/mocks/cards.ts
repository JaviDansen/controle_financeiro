import { Card } from '../../types/finance';

export const CARDS: Card[] = [
  {
    id: 'c1', name: 'Roxinho', bank: 'Nubank', type: 'credit', last4: '4218',
    holder: 'WALBER VIDIGAL', expiry: '08/29',
    limit: 8500.00, used: 3247.50,
    closing_day: 16, best_purchase_day: 19, due_day: 23,
    open_installments_count: 4, open_installments_total: 1280.00,
    current_month_total: 1240.00,
    gradientColors: ['#6B2D8C', '#3B0F66'],
    accent: '#C77BF0',
  },
  {
    id: 'c2', name: 'Black', bank: 'Inter', type: 'credit', last4: '0921',
    holder: 'WALBER VIDIGAL', expiry: '02/30',
    limit: 12000.00, used: 1820.30,
    closing_day: 28, best_purchase_day: 30, due_day: 5,
    open_installments_count: 2, open_installments_total: 640.00,
    current_month_total: 820.30,
    gradientColors: ['#1A1A1A', '#0A0A0A'],
    accent: '#FF7A00',
  },
  {
    id: 'c3', name: 'Conta', bank: 'Itaú', type: 'debit', last4: '7740',
    holder: 'WALBER VIDIGAL', expiry: '11/28',
    limit: null, used: null,
    closing_day: null, best_purchase_day: null, due_day: null,
    open_installments_count: 0, open_installments_total: 0,
    current_month_total: 0,
    gradientColors: ['#F7610B', '#C44400'],
    accent: '#FFFFFF',
  },
];
