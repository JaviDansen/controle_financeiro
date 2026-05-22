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
  bank: string | null;
  type: 'credit' | 'debit';
  last4: string | null;
  holder: string | null;
  expiry: string | null;
  limit: number | null;
  used: number;
  closingDay: number | null;
  bestPurchaseDay: number | null;
  dueDay: number | null;
  openInstallmentsCount: number;
  openInstallmentsTotal: number;
  currentMonthTotal: number;
  gradientColors: [string, string];
  accent: string | null;
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
