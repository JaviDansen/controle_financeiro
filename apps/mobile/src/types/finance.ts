export type CategoryKey =
  | 'food' | 'transport' | 'health' | 'home' | 'subs'
  | 'leisure' | 'income' | 'freelance' | 'shop';

export interface Category {
  label: string;
  color: string;
  letter: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  cat: CategoryKey;
  card: string | null;
  date: string;
  notes: string;
}

export interface Card {
  id: string;
  name: string;
  bank: string;
  type: 'credit' | 'debit';
  last4: string;
  holder: string;
  expiry: string;
  limit: number | null;
  used: number | null;
  closing_day: number | null;
  best_purchase_day: number | null;
  due_day: number | null;
  open_installments_count: number;
  open_installments_total: number;
  current_month_total: number;
  gradientColors: [string, string];
  accent: string;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
  daysLeft: number | null;
  color: string;
  emoji: string;
  active: boolean;
}

export interface User {
  name: string;
  email: string;
  initials: string;
  phone: string;
  joined: string;
  city: string;
}

export interface Summary {
  month: string;
  income: number;
  expense: number;
  daily: number[];
}
