// Cards screen — FinApp
// Composition:
//  - Header: title + "+" to add a card
//  - Horizontal card carousel (full-bleed-ish), snap, paged dots
//  - Selected card details: utilization ring, fatura, parcelas, dias-chave
//  - Filtered transactions for that card

function BigCard({ card, active }) {
  return (
    <div style={{
      flex: '0 0 296px',
      scrollSnapAlign: 'center',
      aspectRatio: '1.586 / 1',
      background: card.gradient,
      borderRadius: 22,
      padding: '18px 20px',
      color: '#fff',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden',
      transform: active ? 'scale(1)' : 'scale(0.94)',
      opacity: active ? 1 : 0.7,
      transition: 'transform .25s ease, opacity .25s ease',
      boxShadow: active ? '0 18px 40px rgba(21,21,26,0.22), 0 4px 10px rgba(21,21,26,0.08)' : '0 6px 14px rgba(21,21,26,0.10)',
    }}>
      {/* decorative gradient bloom */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%',
        background: card.accent, opacity: 0.22, filter: 'blur(28px)',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div>
          <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{card.bank}</div>
          <div style={{ fontSize: 18, fontWeight: 500, marginTop: 2, letterSpacing: '-0.01em' }}>{card.name}</div>
        </div>
        <div style={{
          fontSize: 10, padding: '4px 8px', borderRadius: 999,
          background: 'rgba(255,255,255,0.18)', color: '#fff',
          fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>{card.type === 'credit' ? 'Crédito' : 'Débito'}</div>
      </div>

      {/* chip + wireless */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <div style={{
          width: 32, height: 24, borderRadius: 5,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.25))',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: '4px', borderRadius: 3, border: '0.5px solid rgba(0,0,0,0.2)' }} />
          <div style={{ position: 'absolute', top: '50%', left: 4, right: 4, height: 0.5, background: 'rgba(0,0,0,0.2)' }} />
          <div style={{ position: 'absolute', top: 4, bottom: 4, left: '50%', width: 0.5, background: 'rgba(0,0,0,0.2)' }} />
        </div>
        <Icon.Wifi size={18} sw={1.6} />
      </div>

      <div style={{ position: 'relative' }}>
        <div className="mono" style={{ fontSize: 17, letterSpacing: '0.12em', opacity: 0.95 }}>
          •••• •••• •••• {card.last4}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Titular</div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em' }}>{card.holder}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Validade</div>
            <div className="mono" style={{ fontSize: 11, fontWeight: 500 }}>{card.expiry}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UtilizationRing({ pct, color = 'var(--ink)' }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct);
  return (
    <div style={{ position: 'relative', width: 72, height: 72 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--hairline)" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
                strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
                transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dashoffset .4s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 500, color: 'var(--ink)', fontFamily: 'Geist Mono',
      }}>{Math.round(pct * 100)}%</div>
    </div>
  );
}

function Stat({ label, value, sublabel }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.02em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)', marginTop: 4, letterSpacing: '-0.02em' }}>{value}</div>
      {sublabel && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sublabel}</div>}
    </div>
  );
}

function CardsScreen() {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const scrollRef = React.useRef(null);

  // Update active card based on scroll position
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardWidth = 296 + 12; // card + gap
      const idx = Math.round(el.scrollLeft / cardWidth);
      setActiveIdx(Math.max(0, Math.min(CARDS.length - 1, idx)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const active = CARDS[activeIdx];
  const cardTxs = TRANSACTIONS.filter(t => t.card === active.id);
  const usage = active.limit ? active.used / active.limit : 0;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        paddingTop: 62, paddingLeft: 22, paddingRight: 16, paddingBottom: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
          Cartões
        </h1>
        <button style={{
          height: 38, padding: '0 12px 0 10px', borderRadius: 999,
          background: 'var(--ink)', color: '#FBFAF6', border: 'none',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 500,
        }}>
          <Icon.Plus size={16} sw={2.2} /> Novo
        </button>
      </div>

      {/* Subtitle */}
      <div style={{ padding: '0 22px 18px', fontSize: 13, color: 'var(--muted)' }}>
        {CARDS.length} cartões · {CARDS.filter(c => c.type === 'credit').length} de crédito
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="noscroll"
        style={{
          display: 'flex', gap: 12, overflowX: 'auto',
          paddingLeft: 28, paddingRight: 28,
          paddingBottom: 8,
          scrollSnapType: 'x mandatory',
        }}
      >
        {CARDS.map((card, i) => (
          <BigCard key={card.id} card={card} active={i === activeIdx} />
        ))}
        <div style={{ flex: '0 0 24px' }} />
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '14px 0 6px' }}>
        {CARDS.map((_, i) => (
          <div key={i} style={{
            width: i === activeIdx ? 18 : 6, height: 6, borderRadius: 4,
            background: i === activeIdx ? 'var(--ink)' : 'var(--hairline)',
            transition: 'all .2s ease',
          }} />
        ))}
      </div>

      {/* Detail panel */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 22, padding: 18,
          border: '1px solid var(--hairline)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {active.type === 'credit' ? (
            <>
              {/* Utilization + key numbers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <UtilizationRing pct={usage} color="var(--ink)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.02em', textTransform: 'uppercase', fontWeight: 500 }}>
                    Limite usado
                  </div>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)', marginTop: 4, letterSpacing: '-0.02em' }}>
                    R$ {fmtBRLShort(active.used)}
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    de R$ {fmtBRLShort(active.limit)}
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--hairline)' }} />

              {/* Fatura + parcelas */}
              <div style={{ display: 'flex', gap: 16 }}>
                <Stat
                  label="Fatura atual"
                  value={`R$ ${fmtBRLShort(active.current_month_total)}`}
                  sublabel={`Vence dia ${active.due_day}`}
                />
                <div style={{ width: 1, background: 'var(--hairline)' }} />
                <Stat
                  label="Parcelas abertas"
                  value={`${active.open_installments_count}`}
                  sublabel={`R$ ${fmtBRLShort(active.open_installments_total)} restantes`}
                />
              </div>

              <div style={{ height: 1, background: 'var(--hairline)' }} />

              {/* Best purchase day callout */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--accent-soft)', borderRadius: 14, padding: '12px 14px',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--accent)', color: '#FBFAF6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Geist Mono', fontWeight: 500, fontSize: 14, letterSpacing: '-0.02em',
                }}>{active.best_purchase_day}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent-ink)' }}>Melhor dia de compra</div>
                  <div style={{ fontSize: 11, color: 'var(--accent-ink)', opacity: 0.75, marginTop: 1 }}>
                    Fecha dia {active.closing_day} · próximo útil + 1
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                Cartão de débito
              </div>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.5 }}>
                Usado para categorizar transações pagas no débito. Sem fatura, limite ou parcelamentos.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transactions of this card */}
      <div style={{ padding: '24px 22px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Transações neste cartão
        </h2>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Geist Mono' }}>
          {cardTxs.length}
        </span>
      </div>

      <div style={{ margin: '0 16px 0', background: 'var(--surface)', borderRadius: 18, padding: '4px 16px', border: '1px solid var(--hairline)' }}>
        {cardTxs.length === 0 ? (
          <div style={{ padding: '22px 4px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Nenhuma transação neste cartão ainda.
          </div>
        ) : cardTxs.map((tx, i) => (
          <TxRow key={tx.id} tx={tx} last={i === cardTxs.length - 1} />
        ))}
      </div>

      {/* Spacer */}
      <div style={{ height: 120 }} />
    </div>
  );
}

window.CardsScreen = CardsScreen;
