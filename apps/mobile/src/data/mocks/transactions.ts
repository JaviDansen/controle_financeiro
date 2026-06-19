import { Category, CategoryKey, Transaction } from '../../types/finance';

export const CATEGORIES: Record<CategoryKey, Category> = {
  food:      { label: 'Alimentação', color: '#C07830', letter: 'A' },
  transport: { label: 'Transporte',  color: '#3B5DA0', letter: 'T' },
  health:    { label: 'Saúde',       color: '#B04040', letter: 'S' },
  home:      { label: 'Moradia',     color: '#3D8B4E', letter: 'M' },
  subs:      { label: 'Assinaturas', color: '#6B4EA0', letter: 'A' },
  leisure:   { label: 'Lazer',       color: '#9A8030', letter: 'L' },
  income:    { label: 'Receita',     color: '#3D8B4E', letter: '+' },
  freelance: { label: 'Freelance',   color: '#2E7A8A', letter: 'F' },
  shop:      { label: 'Compras',     color: '#A03070', letter: 'C' },
};

export const TRANSACTIONS: Transaction[] = [
  { id: 't1',  title: 'Salário — Brisanet',         amount: 5800.00, type: 'income',  cat: 'income',    card: null,  date: '14 mai', notes: 'Mensal' },
  { id: 't2',  title: 'Aluguel apartamento',        amount: 1850.00, type: 'expense', cat: 'home',      card: null,  date: '13 mai', notes: '' },
  { id: 't3',  title: 'Mercado Pão de Açúcar',      amount: 312.47,  type: 'expense', cat: 'food',      card: 'c1',  date: '12 mai', notes: '' },
  { id: 't4',  title: 'iFood — Almoço',             amount: 38.90,   type: 'expense', cat: 'food',      card: 'c2',  date: '12 mai', notes: '' },
  { id: 't5',  title: 'Uber para Cohama',           amount: 24.50,   type: 'expense', cat: 'transport', card: 'c2',  date: '11 mai', notes: '' },
  { id: 't6',  title: 'Freela — Logotipo Padaria',  amount: 1200.00, type: 'income',  cat: 'freelance', card: null,  date: '10 mai', notes: '' },
  { id: 't7',  title: 'Netflix',                    amount: 55.90,   type: 'expense', cat: 'subs',      card: 'c1',  date: '09 mai', notes: 'Recorrente' },
  { id: 't8',  title: 'Farmácia Pague Menos',       amount: 87.30,   type: 'expense', cat: 'health',    card: 'c1',  date: '08 mai', notes: '' },
  { id: 't9',  title: 'Cinema São Luís Shopping',   amount: 64.00,   type: 'expense', cat: 'leisure',   card: 'c2',  date: '06 mai', notes: '' },
  { id: 't10', title: 'Posto Ipiranga',             amount: 180.00,  type: 'expense', cat: 'transport', card: 'c1',  date: '04 mai', notes: '' },
  { id: 't11', title: 'Amazon — Livro',             amount: 79.90,   type: 'expense', cat: 'shop',      card: 'c1',  date: '02 mai', notes: 'Parcelado 3x' },
];
