// Cards screen for the Live Server prototype.

function CardDetail({ card }) {
  const usedPercent = Math.min(100, Math.round((card.currentMonthTotal / card.limit) * 100));
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--hairline)',
      borderRadius: 22,
      padding: 14,
      display: 'grid',
      gap: 14,
    }}>
      <div style={{
        height: 148,
        borderRadius: 20,
        padding: 18,
        color: '#fff',
        background: card.gradient,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -34, top: -34, width: 118, height: 118, borderRadius: 999, background: 'rgba(255,255,255,.12)' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: .74 }}>
            <span>{card.brand}</span>
            <span>Credito</span>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 750 }}>{card.name}</div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: .7 }}>**** {card.lastFour}</div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 650 }}>Fatura atual</span>
          <span className="mono" style={{ fontSize: 18, color: 'var(--ink)', fontWeight: 800 }}>{money.format(card.currentMonthTotal)}</span>
        </div>
        <div style={{ marginTop: 10, height: 7, borderRadius: 999, background: '#ECEAE2', overflow: 'hidden' }}>
          <div style={{ width: `${usedPercent}%`, height: '100%', borderRadius: 999, background: 'var(--accent)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
          <span>{usedPercent}% usado</span>
          <span>Limite {money.format(card.limit)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Metric label="Parcelas abertas" value={card.openInstallmentsCount} />
        <Metric label="Total parcelado" value={money.format(card.openInstallmentsTotal)} />
        <Metric label="Fechamento" value={`Dia ${card.closingDay}`} />
        <Metric label="Melhor compra" value={`Dia ${card.bestPurchaseDay}`} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{
      borderRadius: 16,
      background: '#F1EFE7',
      padding: '12px 10px',
      minHeight: 70,
    }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 650 }}>{label}</div>
      <div className="mono" style={{ marginTop: 8, fontSize: 14, color: 'var(--ink)', fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function CardsScreen() {
  return (
    <div style={{
      minHeight: '100%',
      background: 'var(--bg)',
      padding: '72px 20px 118px',
    }}>
      <header style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Resumo financeiro</div>
        <h1 style={{ margin: '3px 0 0', fontSize: 30, fontWeight: 750, letterSpacing: '-0.04em', color: 'var(--ink)' }}>
          Cartoes
        </h1>
      </header>

      <div style={{ display: 'grid', gap: 14 }}>
        {DATA.cards.map((card) => <CardDetail key={card.id} card={card} />)}
      </div>
    </div>
  );
}

Object.assign(window, { CardsScreen });
