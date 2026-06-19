// transactions_example.tsx
// FinApp — Tela de Transações, em TSX.
//
// Composição: header com título + busca/filtro, mini-cards de receita e
// despesa, abas (todas/receitas/despesas), chips de filtros opcionais e
// lista agrupada por data.

import React, { useState } from 'react';
import {
  GlobalStyle, Icon,
  TRANSACTIONS,
  fmtBRLShort,
  TxRow,
  Transaction,
} from './finapp_shared';

type TabKey = 'all' | 'income' | 'expense';

/* ─── TabPill ─────────────────────────────────────────────────────────── */

interface TabPillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}

function TabPill({ active, onClick, children, count }: TabPillProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        flex: 1, padding: '10px 12px', borderRadius: 12,
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? '#FBFAF6' : 'var(--ink-2)',
        border: 'none', fontSize: 13, fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        transition: 'all .15s ease',
        cursor: 'pointer',
      }}
    >
      {children}
      {count !== undefined && (
        <span className="finapp-mono" style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 999,
          background: active ? 'rgba(255,255,255,0.18)' : 'var(--hairline)',
          color: active ? '#FBFAF6' : 'var(--muted)',
        }}>{count}</span>
      )}
    </button>
  );
}

/* ─── FilterChip ──────────────────────────────────────────────────────── */

interface FilterChipProps {
  label: string;
  value: string;
  onRemove?: () => void;
}

function FilterChip({ label, value, onRemove }: FilterChipProps): React.ReactElement {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 8px 6px 10px',
      background: 'var(--surface)', border: '1px solid var(--hairline)',
      borderRadius: 999, fontSize: 12, color: 'var(--ink)', whiteSpace: 'nowrap',
    }}>
      <span style={{ color: 'var(--muted)' }}>{label}:</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          type="button"
          style={{
            background: 'none', border: 'none', padding: 0, color: 'var(--muted)',
            width: 14, height: 14, borderRadius: 999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none"
               stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ─── Estilos locais ──────────────────────────────────────────────────── */

const iconBtn2: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 999,
  background: 'var(--surface)',
  border: '1px solid var(--hairline)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--ink)',
  cursor: 'pointer',
};

const miniSummaryCard: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--hairline)',
  borderRadius: 16, padding: '12px 14px',
};

const posBadge: React.CSSProperties = {
  width: 16, height: 16, borderRadius: 999,
  background: 'var(--pos)', color: '#FBFAF6',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

const negBadge: React.CSSProperties = {
  width: 16, height: 16, borderRadius: 999,
  background: 'var(--neg)', color: '#fff',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

/* ─── Transactions screen ─────────────────────────────────────────────── */

export default function TransactionsScreen(): React.ReactElement {
  const [tab, setTab] = useState<TabKey>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const all = TRANSACTIONS;
  const incomes = all.filter((t: Transaction) => t.type === 'income');
  const expenses = all.filter((t: Transaction) => t.type === 'expense');

  const filtered = tab === 'all' ? all : tab === 'income' ? incomes : expenses;
  const totalIn = incomes.reduce((s: number, t: Transaction) => s + t.amount, 0);
  const totalOut = expenses.reduce((s: number, t: Transaction) => s + t.amount, 0);

  // Group by date string
  const groups: Record<string, Transaction[]> = filtered.reduce(
    (acc: Record<string, Transaction[]>, tx: Transaction) => {
      (acc[tx.date] = acc[tx.date] || []).push(tx);
      return acc;
    },
    {},
  );
  const dateKeys = Object.keys(groups);

  return (
    <>
      <GlobalStyle />
      <div style={{
        background: 'var(--bg)', minHeight: '100%',
        fontFamily: "'Geist', -apple-system, system-ui, sans-serif",
        color: 'var(--ink)',
        WebkitFontSmoothing: 'antialiased',
      }}>
        {/* Header */}
        <div style={{
          paddingTop: 62, paddingLeft: 22, paddingRight: 16, paddingBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{
              margin: 0, fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.03em',
            }}>
              Transações
            </h1>
            <div style={{
              fontSize: 12, color: 'var(--muted)', marginTop: 2,
              display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
            }}>
              <Icon.Calendar size={11} sw={1.6} />
              <span>Maio 2026</span>
              <Icon.ChevR size={10} sw={1.6} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={iconBtn2}>
              <Icon.Search size={18} />
            </button>
            <button
              onClick={() => setShowFilters((s: boolean) => !s)}
              type="button"
              style={{
                ...iconBtn2,
                background: showFilters ? 'var(--ink)' : 'var(--surface)',
                color: showFilters ? '#FBFAF6' : 'var(--ink)',
              }}
            >
              <Icon.Filter size={18} />
            </button>
          </div>
        </div>

        {/* Summary mini-cards */}
        <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={miniSummaryCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={posBadge}><Icon.ArrowDn size={10} sw={2.5} /></span>
              <span style={{
                fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase',
                fontWeight: 500, letterSpacing: '0.04em',
              }}>Receitas</span>
            </div>
            <div className="finapp-mono" style={{
              fontSize: 18, fontWeight: 500, color: 'var(--ink)', marginTop: 6, letterSpacing: '-0.02em',
            }}>
              R$ {fmtBRLShort(totalIn)}
            </div>
          </div>
          <div style={miniSummaryCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={negBadge}><Icon.ArrowUp size={10} sw={2.5} /></span>
              <span style={{
                fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase',
                fontWeight: 500, letterSpacing: '0.04em',
              }}>Despesas</span>
            </div>
            <div className="finapp-mono" style={{
              fontSize: 18, fontWeight: 500, color: 'var(--ink)', marginTop: 6, letterSpacing: '-0.02em',
            }}>
              R$ {fmtBRLShort(totalOut)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            display: 'flex', gap: 4, padding: 4,
            background: 'var(--surface)', border: '1px solid var(--hairline)',
            borderRadius: 16,
          }}>
            <TabPill active={tab === 'all'} onClick={() => setTab('all')} count={all.length}>Todas</TabPill>
            <TabPill active={tab === 'income'} onClick={() => setTab('income')} count={incomes.length}>Receitas</TabPill>
            <TabPill active={tab === 'expense'} onClick={() => setTab('expense')} count={expenses.length}>Despesas</TabPill>
          </div>
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div className="finapp-noscroll" style={{
            display: 'flex', gap: 6, padding: '14px 16px 0',
            overflowX: 'auto',
          }}>
            <FilterChip label="Categoria" value="Todas" onRemove={() => {}} />
            <FilterChip label="Cartão" value="Roxinho" onRemove={() => {}} />
            <FilterChip label="Período" value="Maio 2026" />
          </div>
        )}

        {/* Grouped list */}
        <div style={{ padding: '16px 0 16px' }}>
          {dateKeys.map((dateKey: string) => {
            const dayTxs = groups[dateKey];
            const dayIn = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const dayOut = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            const net = dayIn - dayOut;
            return (
              <div key={dateKey} style={{ marginBottom: 16 }}>
                <div style={{
                  padding: '0 26px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{
                    fontSize: 11, color: 'var(--muted)', fontWeight: 500,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {dateKey}
                  </span>
                  <span className="finapp-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {net >= 0 ? '+' : '−'} R$ {fmtBRLShort(net)}
                  </span>
                </div>
                <div style={{
                  margin: '0 16px', background: 'var(--surface)', borderRadius: 18,
                  padding: '4px 16px', border: '1px solid var(--hairline)',
                }}>
                  {dayTxs.map((tx: Transaction, i: number) => (
                    <TxRow key={tx.id} tx={tx} last={i === dayTxs.length - 1} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: 120 }} />
      </div>
    </>
  );
}
