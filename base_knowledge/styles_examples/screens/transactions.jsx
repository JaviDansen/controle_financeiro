// Transactions screen — full list with filters and grouped by date.

function TabPill({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 12px', borderRadius: 12,
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? '#FBFAF6' : 'var(--ink-2)',
        border: 'none', fontSize: 13, fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        transition: 'all .15s ease',
      }}
    >
      {children}
      {count !== undefined && (
        <span className="mono" style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 999,
          background: active ? 'rgba(255,255,255,0.18)' : 'var(--hairline)',
          color: active ? '#FBFAF6' : 'var(--muted)',
        }}>{count}</span>
      )}
    </button>
  );
}

function FilterChip({ label, value, onRemove }) {
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
        <button onClick={onRemove} style={{
          background: 'none', border: 'none', padding: 0, color: 'var(--muted)',
          width: 14, height: 14, borderRadius: 999, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      )}
    </div>
  );
}

function TransactionsScreen() {
  const [tab, setTab] = React.useState('all'); // 'all' | 'income' | 'expense'
  const [showFilters, setShowFilters] = React.useState(false);

  const all = TRANSACTIONS;
  const incomes = all.filter(t => t.type === 'income');
  const expenses = all.filter(t => t.type === 'expense');

  const filtered = tab === 'all' ? all : tab === 'income' ? incomes : expenses;
  const totalIn = incomes.reduce((s, t) => s + t.amount, 0);
  const totalOut = expenses.reduce((s, t) => s + t.amount, 0);

  // Group by date string
  const groups = filtered.reduce((acc, tx) => {
    (acc[tx.date] = acc[tx.date] || []).push(tx);
    return acc;
  }, {});
  const dateKeys = Object.keys(groups);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        paddingTop: 62, paddingLeft: 22, paddingRight: 16, paddingBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
            Transações
          </h1>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <Icon.Calendar size={11} sw={1.6} />
            <span>Maio 2026</span>
            <Icon.ChevR size={10} sw={1.6} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={iconBtn2}><Icon.Search size={18} /></button>
          <button
            onClick={() => setShowFilters(s => !s)}
            style={{
              ...iconBtn2,
              background: showFilters ? 'var(--ink)' : 'var(--surface)',
              color: showFilters ? '#FBFAF6' : 'var(--ink)',
            }}
          ><Icon.Filter size={18} /></button>
        </div>
      </div>

      {/* Summary mini-cards */}
      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={miniSummaryCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={posBadge}><Icon.ArrowDn size={10} sw={2.5} /></span>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.04em' }}>Receitas</span>
          </div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)', marginTop: 6, letterSpacing: '-0.02em' }}>
            R$ {fmtBRLShort(totalIn)}
          </div>
        </div>
        <div style={miniSummaryCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={negBadge}><Icon.ArrowUp size={10} sw={2.5} /></span>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.04em' }}>Despesas</span>
          </div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)', marginTop: 6, letterSpacing: '-0.02em' }}>
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
        <div className="noscroll" style={{
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
        {dateKeys.map(dateKey => {
          const dayTxs = groups[dateKey];
          const dayIn = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const dayOut = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const net = dayIn - dayOut;
          return (
            <div key={dateKey} style={{ marginBottom: 16 }}>
              <div style={{
                padding: '0 26px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {dateKey}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {net >= 0 ? '+' : '−'} R$ {fmtBRLShort(net)}
                </span>
              </div>
              <div style={{ margin: '0 16px', background: 'var(--surface)', borderRadius: 18, padding: '4px 16px', border: '1px solid var(--hairline)' }}>
                {dayTxs.map((tx, i) => (
                  <TxRow key={tx.id} tx={tx} last={i === dayTxs.length - 1} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 120 }} />
    </div>
  );
}

const iconBtn2 = {
  width: 38, height: 38, borderRadius: 999,
  background: 'var(--surface)',
  border: '1px solid var(--hairline)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--ink)',
};

const miniSummaryCard = {
  background: 'var(--surface)', border: '1px solid var(--hairline)',
  borderRadius: 16, padding: '12px 14px',
};

const posBadge = {
  width: 16, height: 16, borderRadius: 999,
  background: 'var(--pos)', color: '#FBFAF6',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

const negBadge = {
  width: 16, height: 16, borderRadius: 999,
  background: 'var(--neg)', color: '#fff',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

window.TransactionsScreen = TransactionsScreen;
