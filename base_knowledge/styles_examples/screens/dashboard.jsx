// Dashboard / Home screen — FinApp
// Sections: greeting + month, hero balance card, mini chart, últimas transações,
// resumo de cartões (only credit), FAB for new transaction.

function Sparkbars({ data, color = 'var(--ink)', height = 36 }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, minWidth: 4,
          height: `${(v / max) * 100}%`, minHeight: v > 0 ? 3 : 2,
          background: v > 0 ? color : 'rgba(255,255,255,0.15)',
          borderRadius: 2,
          opacity: v > 0 ? (0.5 + (i / data.length) * 0.5) : 1,
        }} />
      ))}
    </div>
  );
}

function CategoryDot({ cat, size = 36 }) {
  const c = CATEGORIES[cat] || CATEGORIES.shop;
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2.4,
      background: `color-mix(in oklch, ${c.color} 14%, white)`,
      color: c.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 600,
      fontFamily: 'Geist Mono',
      flexShrink: 0,
    }}>{c.letter}</div>
  );
}

function TxRow({ tx, last }) {
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
      <div className="mono" style={{
        fontSize: 15, fontWeight: 500,
        color: isPos ? 'var(--pos)' : 'var(--ink)',
        whiteSpace: 'nowrap',
      }}>
        {isPos ? '+' : '−'} {fmtBRLShort(tx.amount)}
      </div>
    </div>
  );
}

function MiniCardSummary({ card, onTap }) {
  const usedPct = card.used / card.limit;
  return (
    <button
      onClick={onTap}
      style={{
        textAlign: 'left',
        flex: '0 0 220px', scrollSnapAlign: 'start',
        background: card.gradient,
        color: '#fff',
        border: 'none',
        borderRadius: 18,
        padding: '14px 16px 14px',
        display: 'flex', flexDirection: 'column', gap: 8,
        minHeight: 130,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%',
        background: card.accent, opacity: 0.18, filter: 'blur(20px)', pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{card.bank}</div>
          <div style={{ fontSize: 15, fontWeight: 500, marginTop: 2 }}>{card.name}</div>
        </div>
        <div className="mono" style={{ fontSize: 11, opacity: 0.7 }}>•• {card.last4}</div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 11, opacity: 0.7 }}>Fatura atual</div>
        <div className="mono" style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>
          R$ {fmtBRLShort(card.current_month_total)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.7, marginTop: 6 }}>
          <span>{card.open_installments_count} parcelas abertas</span>
          <span>Fecha dia {card.closing_day}</span>
        </div>
      </div>
    </button>
  );
}

function DashboardScreen({ onOpenCards, onOpenProfile }) {
  const recent = TRANSACTIONS.slice(0, 5);
  const creditCards = CARDS.filter(c => c.type === 'credit');
  const balance = SUMMARY.income - SUMMARY.expense;
  const [showBalance, setShowBalance] = React.useState(true);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        paddingTop: 58, paddingLeft: 22, paddingRight: 22, paddingBottom: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={onOpenProfile}
          style={{
            background: 'none', border: 'none', padding: 0,
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 999,
            background: 'var(--ink)', color: '#FBFAF6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, letterSpacing: '0.02em',
          }}>WV</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Olá,</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', marginTop: 1 }}>Walber</div>
          </div>
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={iconBtn}><Icon.Search size={18} /></button>
          <button style={iconBtn}>
            <Icon.Bell size={18} />
            <span style={{
              position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: '50%',
              background: 'var(--neg)', border: '1.5px solid var(--bg)',
            }} />
          </button>
        </div>
      </div>

      {/* Balance hero card */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          background: 'var(--ink)',
          color: '#FBFAF6',
          borderRadius: 22,
          padding: '18px 20px 20px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* subtle decorative grid */}
          <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: 'absolute', right: -30, top: -30, opacity: 0.06 }}>
            <defs><pattern id="g" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" stroke="#fff" strokeWidth="0.5" fill="none" />
            </pattern></defs>
            <rect width="160" height="160" fill="url(#g)" />
          </svg>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.7, whiteSpace: 'nowrap' }}>
              <Icon.Calendar size={13} />
              <span>{SUMMARY.month}</span>
              <Icon.ChevR size={11} sw={1.5} />
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', display: 'flex', padding: 6, borderRadius: 999 }}
            >
              {showBalance ? <Icon.Eye size={14} /> : <Icon.EyeOff size={14} />}
            </button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 14, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Saldo do mês
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 18, opacity: 0.6 }}>R$</span>
            <span className="mono" style={{ fontSize: 40, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {showBalance ? fmtBRLShort(balance) : '•••••'}
            </span>
          </div>

          {/* Mini bar chart */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.6, marginBottom: 6, whiteSpace: 'nowrap', gap: 8 }}>
              <span>Despesas — últimos 14 dias</span>
              <span className="mono">R$ {fmtBRLShort(SUMMARY.expense)}</span>
            </div>
            <Sparkbars data={SUMMARY.daily} color="#FBFAF6" height={32} />
          </div>

          {/* Income / Expense split */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            marginTop: 18,
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, opacity: 0.7 }}>
                <span style={{ width: 14, height: 14, borderRadius: 999, background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#0A0A0A' }}>
                  <Icon.ArrowDn size={9} sw={2.5} />
                </span>
                Receitas
              </div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>
                {showBalance ? `R$ ${fmtBRLShort(SUMMARY.income)}` : '•••••'}
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, opacity: 0.7 }}>
                <span style={{ width: 14, height: 14, borderRadius: 999, background: 'var(--neg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Icon.ArrowUp size={9} sw={2.5} />
                </span>
                Despesas
              </div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>
                {showBalance ? `R$ ${fmtBRLShort(SUMMARY.expense)}` : '•••••'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ padding: '24px 22px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Últimas transações</h2>
        <button style={linkBtn}>Ver todas</button>
      </div>
      <div style={{ margin: '0 16px', background: 'var(--surface)', borderRadius: 18, padding: '4px 16px', border: '1px solid var(--hairline)' }}>
        {recent.map((tx, i) => (
          <TxRow key={tx.id} tx={tx} last={i === recent.length - 1} />
        ))}
      </div>

      {/* Cards summary */}
      <div style={{ padding: '24px 22px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Cartões de crédito</h2>
        <button style={linkBtn} onClick={onOpenCards}>Ver todos</button>
      </div>
      <div className="noscroll" style={{
        display: 'flex', gap: 12, overflowX: 'auto',
        padding: '4px 16px 4px',
        scrollSnapType: 'x mandatory',
      }}>
        {creditCards.map(card => (
          <MiniCardSummary key={card.id} card={card} onTap={onOpenCards} />
        ))}
      </div>

      {/* Spacer for tab bar + FAB */}
      <div style={{ height: 120 }} />
    </div>
  );
}

const iconBtn = {
  width: 40, height: 40, borderRadius: 999,
  background: 'var(--surface)',
  border: '1px solid var(--hairline)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--ink)', position: 'relative',
};

const linkBtn = {
  background: 'none', border: 'none', padding: 0,
  fontSize: 13, color: 'var(--ink-2)', fontWeight: 500,
  textDecoration: 'underline', textUnderlineOffset: 3,
};

window.DashboardScreen = DashboardScreen;
window.CategoryDot = CategoryDot;
window.TxRow = TxRow;
