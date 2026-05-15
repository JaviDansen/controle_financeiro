// Dashboard screen for the Live Server prototype.

function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 650, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{title}</h2>
      {action && (
        <button onClick={onAction} style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--accent-ink)',
          fontSize: 12,
          fontWeight: 700,
          padding: 4,
        }}>
          {action}
        </button>
      )}
    </div>
  );
}

function BalanceCard({ summary }) {
  const balancePositive = summary.balance >= 0;
  return (
    <div style={{
      background: 'var(--ink)',
      color: 'var(--surface)',
      borderRadius: 24,
      padding: 20,
      boxShadow: '0 18px 36px rgba(21,21,26,0.18)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        right: -56,
        top: -56,
        width: 160,
        height: 160,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.08)',
      }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(251,250,246,0.68)', fontWeight: 600 }}>{summary.monthLabel}</span>
          <Icon.Eye size={18} sw={1.7} />
        </div>
        <div style={{ marginTop: 20, fontSize: 13, color: 'rgba(251,250,246,0.68)' }}>Saldo atual</div>
        <div className="mono" style={{
          marginTop: 4,
          fontSize: 34,
          lineHeight: 1,
          fontWeight: 700,
          color: balancePositive ? 'var(--accent)' : 'var(--neg)',
        }}>
          {money.format(summary.balance)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22 }}>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(251,250,246,0.6)' }}>Receitas</div>
            <div className="mono" style={{ marginTop: 5, color: 'var(--accent)', fontWeight: 700 }}>{money.format(summary.totalIncome)}</div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(251,250,246,0.6)' }}>Despesas</div>
            <div className="mono" style={{ marginTop: 5, color: '#FF8B75', fontWeight: 700 }}>{money.format(summary.totalExpenses)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ tx }) {
  const income = tx.type === 'income';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 14,
        background: income ? 'var(--accent-soft)' : 'var(--neg-soft)',
        color: income ? 'var(--accent-ink)' : 'var(--neg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {income ? <Icon.ArrowDn size={17} sw={2.2} /> : <Icon.ArrowUp size={17} sw={2.2} />}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.title}</div>
        <div style={{ marginTop: 3, fontSize: 12, color: 'var(--muted)' }}>{tx.category} · {shortDate.format(new Date(tx.date))}</div>
      </div>
      <div className="mono" style={{
        fontSize: 13,
        fontWeight: 800,
        color: income ? 'var(--accent-ink)' : 'var(--neg)',
      }}>
        {income ? '+' : '-'}{money.format(tx.amount)}
      </div>
    </div>
  );
}

function MiniCard({ card, onClick }) {
  const used = Math.min(100, Math.round((card.currentMonthTotal / card.limit) * 100));
  return (
    <button onClick={onClick} style={{
      width: 240,
      minWidth: 240,
      border: 'none',
      textAlign: 'left',
      borderRadius: 20,
      padding: 16,
      color: '#fff',
      background: card.gradient,
      boxShadow: '0 14px 28px rgba(21,21,26,0.14)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,.14), transparent 48%)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: .74 }}>
          <span>{card.brand}</span>
          <span>**** {card.lastFour}</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 15, fontWeight: 700 }}>{card.name}</div>
        <div className="mono" style={{ marginTop: 8, fontSize: 21, fontWeight: 800 }}>{money.format(card.currentMonthTotal)}</div>
        <div style={{ marginTop: 12, height: 5, borderRadius: 999, background: 'rgba(255,255,255,.22)', overflow: 'hidden' }}>
          <div style={{ width: `${used}%`, height: '100%', borderRadius: 999, background: 'rgba(255,255,255,.86)' }} />
        </div>
      </div>
    </button>
  );
}

function DashboardScreen({ onOpenCards }) {
  return (
    <div style={{
      minHeight: '100%',
      background: 'var(--bg)',
      padding: '72px 20px 118px',
    }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{DATA.user.greeting}</div>
          <h1 style={{ margin: '3px 0 0', fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--ink)' }}>
            {DATA.user.name}
          </h1>
        </div>
        <button style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          border: '1px solid var(--hairline)',
          background: 'var(--surface)',
          color: 'var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon.Bell size={18} sw={1.8} />
        </button>
      </header>

      <BalanceCard summary={DATA.summary} />

      <section style={{ marginTop: 24 }}>
        <SectionHeader title="Cartoes" action="Ver todos" onAction={onOpenCards} />
        <div className="noscroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {DATA.cards.map((card) => <MiniCard key={card.id} card={card} onClick={onOpenCards} />)}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <SectionHeader title="Ultimas transacoes" action="Ver tudo" />
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--hairline)',
          borderRadius: 20,
          padding: '2px 14px',
        }}>
          {DATA.transactions.map((tx, index) => (
            <React.Fragment key={tx.id}>
              <TransactionRow tx={tx} />
              {index < DATA.transactions.length - 1 && <div style={{ height: 1, background: 'var(--hairline)', marginLeft: 52 }} />}
            </React.Fragment>
          ))}
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { DashboardScreen });
