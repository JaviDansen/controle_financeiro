// finapp_shared.tsx
// Pedaços comuns usados por TODAS as telas FinApp em TSX.
//
// Inclui:
//   • Tipos (Transaction, Card, Goal, User, etc.)
//   • Tokens CSS (cores, fontes) + keyframes — injetados via <GlobalStyle/>
//   • Ícones SVG (stroke, viewBox 20×20)
//   • Helpers: fmtBRL, fmtBRLShort
//   • Mock data: TRANSACTIONS, CARDS, GOALS, USER, SUMMARY, CATEGORIES
//   • Componentes compartilhados: <FinAppMark/>, <Field/>
//
// Uso:
//   import { GlobalStyle, Icon, FinAppMark, Field, CARDS, TRANSACTIONS, ... } from './finapp_shared';

import React, { useState } from 'react';

/* ─── Tipos ────────────────────────────────────────────────────────────── */

export interface IconProps {
  size?: number;
  sw?: number;
}

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
  gradient: string;
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

export interface FieldProps {
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  placeholder?: string;
}

export interface FinAppMarkProps {
  size?: number;
  dark?: boolean;
}

/* ─── Estilos globais (CSS vars + keyframes) ──────────────────────────── */

const FINAPP_CSS = `
  :root {
    --bg: #ECE7DC;
    --surface: #FBFAF6;
    --ink: #15151A;
    --ink-2: #3B3B43;
    --muted: #8B8B92;
    --hairline: #1515151A;
    --accent: oklch(0.55 0.13 150);
    --accent-soft: oklch(0.92 0.04 150);
    --accent-ink: oklch(0.32 0.09 150);
    --pos: oklch(0.55 0.13 150);
    --neg: oklch(0.55 0.15 28);
    --neg-soft: oklch(0.94 0.03 28);
  }
  .finapp-mono {
    font-family: 'Geist Mono', ui-monospace, monospace;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  .finapp-noscroll::-webkit-scrollbar { display: none; }
  .finapp-noscroll { scrollbar-width: none; }
  @keyframes finapp-spin { to { transform: rotate(360deg); } }
`;

export function GlobalStyle(): React.ReactElement {
  return <style dangerouslySetInnerHTML={{ __html: FINAPP_CSS }} />;
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

export const fmtBRL = (n: number): string => {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return sign + 'R$ ' + abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const fmtBRLShort = (n: number): string => {
  const abs = Math.abs(n);
  return abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/* ─── Ícones ──────────────────────────────────────────────────────────── */

export const Icon = {
  Home: ({ size = 20, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3v-5H7v5H4a1 1 0 0 1-1-1V9.5Z" />
    </svg>
  ),
  Tx: ({ size = 20, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h10M14 7l-3-3M14 7l-3 3" />
      <path d="M16 13H6M6 13l3-3M6 13l3 3" />
    </svg>
  ),
  Card: ({ size = 20, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="5" width="15" height="11" rx="2" />
      <path d="M2.5 9h15" />
      <path d="M5.5 13h2" />
    </svg>
  ),
  Goal: ({ size = 20, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="3.5" />
      <circle cx="10" cy="10" r="0.6" fill="currentColor" />
    </svg>
  ),
  Profile: ({ size = 20, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3" />
      <path d="M3.5 17c1-3.4 3.6-5 6.5-5s5.5 1.6 6.5 5" />
    </svg>
  ),
  Plus: ({ size = 20, sw = 2 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  ),
  ChevR: ({ size = 14, sw = 1.8 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4l6 6-6 6" />
    </svg>
  ),
  ChevL: ({ size = 14, sw = 1.8 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 4l-6 6 6 6" />
    </svg>
  ),
  Eye: ({ size = 18, sw = 1.5 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 10s3-6 8.5-6 8.5 6 8.5 6-3 6-8.5 6S1.5 10 1.5 10Z" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  ),
  EyeOff: ({ size = 18, sw = 1.5 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l14 14" />
      <path d="M6.5 5.5C7.6 4.9 8.7 4.5 10 4.5c5.5 0 8.5 5.5 8.5 5.5a14 14 0 0 1-2.5 3" />
      <path d="M13.5 13.5A4 4 0 0 1 6.5 6.5" />
      <path d="M1.5 10s1.4-2.7 4.3-4.5" />
    </svg>
  ),
  ArrowUp: ({ size = 14, sw = 2 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 16V5M5 10l5-5 5 5" />
    </svg>
  ),
  ArrowDn: ({ size = 14, sw = 2 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4v11M5 10l5 5 5-5" />
    </svg>
  ),
  Bell: ({ size = 18, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 14V9a5 5 0 0 1 10 0v5l1.5 2h-13L5 14Z" />
      <path d="M8.5 17.5a2 2 0 0 0 3 0" />
    </svg>
  ),
  Search: ({ size = 18, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="5.5" /><path d="M13 13l3.5 3.5" />
    </svg>
  ),
  More: ({ size = 18 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor">
      <circle cx="4" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="16" cy="10" r="1.6" />
    </svg>
  ),
  Filter: ({ size = 16, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h14M5.5 10h9M8 15h4" />
    </svg>
  ),
  Check: ({ size = 14, sw = 2.2 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  ),
  Calendar: ({ size = 16, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="14" height="13" rx="2" />
      <path d="M3 8.5h14M7 3v3M13 3v3" />
    </svg>
  ),
  Lock: ({ size = 16, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="9" width="12" height="8" rx="2" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  ),
  Mail: ({ size = 16, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="M3 6l7 5 7-5" />
    </svg>
  ),
  Wifi: ({ size = 16, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7.5c4.5-4 11.5-4 16 0M5 11c2.7-2.4 7.3-2.4 10 0" />
      <circle cx="10" cy="14.5" r="1" fill="currentColor" />
    </svg>
  ),
};

/* ─── Mock data ───────────────────────────────────────────────────────── */

export const CATEGORIES: Record<CategoryKey, Category> = {
  food:      { label: 'Alimentação', color: 'oklch(0.70 0.14 50)',  letter: 'A' },
  transport: { label: 'Transporte',  color: 'oklch(0.55 0.13 250)', letter: 'T' },
  health:    { label: 'Saúde',       color: 'oklch(0.60 0.13 10)',  letter: 'S' },
  home:      { label: 'Moradia',     color: 'oklch(0.55 0.13 150)', letter: 'M' },
  subs:      { label: 'Assinaturas', color: 'oklch(0.55 0.10 290)', letter: 'A' },
  leisure:   { label: 'Lazer',       color: 'oklch(0.65 0.13 80)',  letter: 'L' },
  income:    { label: 'Receita',     color: 'oklch(0.55 0.13 150)', letter: '+' },
  freelance: { label: 'Freelance',   color: 'oklch(0.55 0.13 200)', letter: 'F' },
  shop:      { label: 'Compras',     color: 'oklch(0.60 0.12 320)', letter: 'C' },
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

export const CARDS: Card[] = [
  {
    id: 'c1', name: 'Roxinho', bank: 'Nubank', type: 'credit', last4: '4218',
    holder: 'WALBER VIDIGAL', expiry: '08/29',
    limit: 8500.00, used: 3247.50,
    closing_day: 16, best_purchase_day: 19, due_day: 23,
    open_installments_count: 4, open_installments_total: 1280.00,
    current_month_total: 1240.00,
    gradient: 'linear-gradient(135deg, #6B2D8C 0%, #3B0F66 100%)',
    accent: '#C77BF0',
  },
  {
    id: 'c2', name: 'Black', bank: 'Inter', type: 'credit', last4: '0921',
    holder: 'WALBER VIDIGAL', expiry: '02/30',
    limit: 12000.00, used: 1820.30,
    closing_day: 28, best_purchase_day: 30, due_day: 5,
    open_installments_count: 2, open_installments_total: 640.00,
    current_month_total: 820.30,
    gradient: 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)',
    accent: '#FF7A00',
  },
  {
    id: 'c3', name: 'Conta', bank: 'Itaú', type: 'debit', last4: '7740',
    holder: 'WALBER VIDIGAL', expiry: '11/28',
    limit: null, used: null,
    closing_day: null, best_purchase_day: null, due_day: null,
    open_installments_count: 0, open_installments_total: 0,
    current_month_total: 0,
    gradient: 'linear-gradient(135deg, #F7610B 0%, #C44400 100%)',
    accent: '#FFF',
  },
];

export const SUMMARY: Summary = {
  month: 'Maio 2026',
  income: 7000.00,
  expense: 2693.97,
  daily: [40, 0, 120, 65, 0, 220, 80, 38, 24, 87, 64, 0, 312, 180],
};

export const GOALS: Goal[] = [
  { id: 'g1', title: 'Viagem para Jericoacoara', target: 4500, current: 2890, deadline: '15 dez 2026', daysLeft: 214, color: 'oklch(0.65 0.14 50)',  emoji: 'J', active: true  },
  { id: 'g2', title: 'Reserva de emergência',    target: 18000, current: 11250, deadline: 'sem prazo',  daysLeft: null, color: 'oklch(0.55 0.13 150)', emoji: 'R', active: true  },
  { id: 'g3', title: 'MacBook novo',             target: 12500, current: 4100,  deadline: '30 set 2026', daysLeft: 138, color: 'oklch(0.50 0.18 270)', emoji: 'M', active: true  },
  { id: 'g4', title: 'Curso de inglês',          target: 2400,  current: 2400,  deadline: '01 mar 2026', daysLeft: 0,   color: 'oklch(0.55 0.13 200)', emoji: 'C', active: false },
];

export const USER: User = {
  name: 'Walber Vidigal',
  email: 'walber@brisanet.com',
  initials: 'WV',
  phone: '+55 98 9 8765-4321',
  joined: 'Maio 2026',
  city: 'São Luís, MA',
};

/* ─── Wordmark ────────────────────────────────────────────────────────── */

export function FinAppMark({ size = 32, dark = false }: FinAppMarkProps): React.ReactElement {
  const ink = dark ? '#FBFAF6' : '#15151A';
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 0,
      fontFamily: "'Geist', -apple-system, system-ui, sans-serif",
      color: ink,
    }}>
      <span style={{ fontSize: size, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}>fin</span>
      <span style={{
        width: size * 0.18, height: size * 0.18, borderRadius: 999,
        background: 'var(--accent)', display: 'inline-block',
        margin: `0 ${size * 0.06}px ${size * 0.06}px`, alignSelf: 'flex-end',
      }} />
      <span style={{ fontSize: size, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}>app</span>
    </div>
  );
}

/* ─── Field (input com label, ícone e trailing) ───────────────────────── */

export function Field({
  label, type = 'text', value, onChange, icon, trailing, placeholder,
}: FieldProps): React.ReactElement {
  const [focused, setFocused] = useState<boolean>(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 12, fontWeight: 500, color: 'var(--muted)',
        letterSpacing: '0.02em', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#FBFAF6',
        border: `1px solid ${focused ? 'var(--ink)' : 'var(--hairline)'}`,
        borderRadius: 14, padding: '14px 14px',
        transition: 'border-color .15s ease',
      }}>
        {icon && <span style={{ color: 'var(--muted)', display: 'flex' }}>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontSize: 16, color: 'var(--ink)', minWidth: 0,
            fontFamily: type === 'password' ? "'Geist Mono', ui-monospace, monospace" : "'Geist', system-ui, sans-serif",
            letterSpacing: type === 'password' ? '0.15em' : 'normal',
          }}
        />
        {trailing}
      </div>
    </div>
  );
}

/* ─── Compartilhados: linha de transação + dot de categoria ───────────── */

export function CategoryDot({ cat, size = 36 }: { cat: CategoryKey; size?: number }): React.ReactElement {
  const c = CATEGORIES[cat] || CATEGORIES.shop;
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2.4,
      background: `color-mix(in oklch, ${c.color} 14%, white)`,
      color: c.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 600,
      fontFamily: "'Geist Mono', ui-monospace, monospace",
      flexShrink: 0,
    }}>{c.letter}</div>
  );
}

export function TxRow({ tx, last }: { tx: Transaction; last?: boolean }): React.ReactElement {
  const c = CATEGORIES[tx.cat] || CATEGORIES.shop;
  const isPos = tx.type === 'income';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 0',
      borderBottom: last ? 'none' : '1px solid var(--hairline)',
    }}>
      <CategoryDot cat={tx.cat} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {tx.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
          {c.label} · {tx.date}
        </div>
      </div>
      <div className="finapp-mono" style={{
        fontSize: 15, fontWeight: 500,
        color: isPos ? 'var(--pos)' : 'var(--ink)',
        whiteSpace: 'nowrap',
      }}>
        {isPos ? '+' : '−'} {fmtBRLShort(tx.amount)}
      </div>
    </div>
  );
}
