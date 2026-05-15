// App shell — FinApp prototype
// Composes: iOS frame + screen routing (login → main with tab bar) + tweaks panel.

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "green",
  "showTwoFrames": true,
  "screen": "login"
}/*EDITMODE-END*/;

// Accent palette options
const ACCENT_PALETTES = {
  green: {
    accent: 'oklch(0.55 0.13 150)',
    soft: 'oklch(0.92 0.04 150)',
    ink: 'oklch(0.32 0.09 150)',
  },
  amber: {
    accent: 'oklch(0.68 0.15 70)',
    soft: 'oklch(0.94 0.05 70)',
    ink: 'oklch(0.38 0.10 60)',
  },
  indigo: {
    accent: 'oklch(0.50 0.18 270)',
    soft: 'oklch(0.93 0.04 270)',
    ink: 'oklch(0.30 0.11 270)',
  },
  rose: {
    accent: 'oklch(0.58 0.18 10)',
    soft: 'oklch(0.94 0.04 10)',
    ink: 'oklch(0.34 0.12 10)',
  },
};

function TabBar({ tab, onChange, onAdd }) {
  const items = [
    { id: 'home',  label: 'Início',    Icon: Icon.Home },
    { id: 'tx',    label: 'Transações',Icon: Icon.Tx },
    { id: 'cards', label: 'Cartões',   Icon: Icon.Card },
    { id: 'goals', label: 'Metas',     Icon: Icon.Goal },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 30, paddingTop: 10,
      paddingLeft: 14, paddingRight: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 8,
      background: 'linear-gradient(to top, var(--bg) 65%, rgba(236, 231, 220, 0))',
      zIndex: 30,
    }}>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        background: 'var(--surface)', border: '1px solid var(--hairline)',
        borderRadius: 999, padding: '6px 10px',
        boxShadow: '0 8px 20px rgba(21,21,26,0.06)',
      }}>
        {items.map(it => {
          const active = tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              style={{
                background: 'none', border: 'none', padding: '8px 10px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                color: active ? 'var(--ink)' : 'var(--muted)',
                position: 'relative',
              }}
            >
              <it.Icon size={20} sw={active ? 1.9 : 1.5} />
              <span style={{ fontSize: 9.5, fontWeight: active ? 600 : 500, letterSpacing: '0.02em' }}>{it.label}</span>
              {active && (
                <div style={{
                  position: 'absolute', bottom: -4, width: 4, height: 4, borderRadius: 999,
                  background: 'var(--accent)',
                }} />
              )}
            </button>
          );
        })}
      </div>
      <button
        onClick={onAdd}
        style={{
          width: 54, height: 54, borderRadius: 999,
          background: 'var(--ink)', color: '#FBFAF6', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 24px rgba(21,21,26,0.30), 0 2px 6px rgba(21,21,26,0.12)',
          flexShrink: 0,
        }}
      >
        <Icon.Plus size={22} sw={2.2} />
      </button>
    </div>
  );
}

function NewTxSheet({ open, onClose }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      pointerEvents: open ? 'auto' : 'none', zIndex: 60,
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(21,21,26,0.45)',
        opacity: open ? 1 : 0, transition: 'opacity .25s ease',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--surface)', borderRadius: '24px 24px 0 0',
        padding: '14px 22px 36px',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .3s cubic-bezier(.2,.8,.2,1)',
        boxShadow: '0 -20px 40px rgba(0,0,0,0.15)',
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--hairline)', margin: '0 auto 18px' }} />
        <h3 style={{ margin: '0 0 18px', fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          Nova transação
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <button style={{
            padding: '14px 12px', borderRadius: 14, border: '1px solid var(--accent)',
            background: 'var(--accent-soft)', color: 'var(--accent-ink)',
            fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
          }}>
            <Icon.ArrowDn size={14} sw={2.2} /> Receita
          </button>
          <button style={{
            padding: '14px 12px', borderRadius: 14, border: '1px solid var(--hairline)',
            background: 'transparent', color: 'var(--ink-2)',
            fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
          }}>
            <Icon.ArrowUp size={14} sw={2.2} /> Despesa
          </button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>
          Em construção · formulário completo no próximo sprint
        </div>
        <button onClick={onClose} style={{
          width: '100%', height: 50, borderRadius: 14, border: '1px solid var(--hairline)',
          background: 'transparent', color: 'var(--ink)', fontSize: 14, fontWeight: 500, marginTop: 8,
        }}>
          Fechar
        </button>
      </div>
    </div>
  );
}

function PlaceholderScreen({ title, hint }) {
  return (
    <div style={{
      paddingTop: 60, padding: '60px 24px 24px',
      background: 'var(--bg)', height: '100%',
    }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.03em' }}>{title}</h1>
      <div style={{
        marginTop: 24, padding: '40px 24px', borderRadius: 18,
        background: 'var(--surface)', border: '1px dashed var(--hairline)',
        textAlign: 'center', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6,
      }}>
        {hint}
      </div>
    </div>
  );
}

function PhoneApp({ initialScreen = 'login', accent = 'green', frameLabel }) {
  const [screen, setScreen] = useState(initialScreen);
  const [tab, setTab] = useState('home');
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => { setScreen(initialScreen); }, [initialScreen]);

  // Apply accent palette via CSS custom props scoped to this frame
  const palette = ACCENT_PALETTES[accent] || ACCENT_PALETTES.green;

  let inner;
  if (screen === 'login') {
    inner = <LoginScreen onSignIn={() => { setScreen('app'); setTab('home'); }} />;
  } else {
    const tabContent = {
      home:  <DashboardScreen onOpenCards={() => setTab('cards')} />,
      cards: <CardsScreen />,
      tx:    <PlaceholderScreen title="Transações" hint="Lista completa com filtros por tipo, categoria, data e cartão." />,
      goals: <PlaceholderScreen title="Metas" hint="Objetivos financeiros com progresso e prazo. Próximo módulo da Fase 1." />,
    }[tab];
    inner = (
      <>
        {tabContent}
        <TabBar tab={tab} onChange={setTab} onAdd={() => setSheetOpen(true)} />
        <NewTxSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </>
    );
  }

  return (
    <div style={{
      position: 'relative',
      '--accent': palette.accent,
      '--accent-soft': palette.soft,
      '--accent-ink': palette.ink,
      '--pos': palette.accent,
    }}>
      <IOSDevice width={390} height={844}>
        <div style={{
          height: '100%', width: '100%', overflow: 'hidden', position: 'relative',
        }}>
          <div className="noscroll" style={{ height: '100%', overflow: 'auto' }}>
            {inner}
          </div>
        </div>
      </IOSDevice>
      {frameLabel && (
        <div style={{
          marginTop: 16, textAlign: 'center',
          fontSize: 12, color: 'var(--ink-2)',
          letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500,
        }}>
          {frameLabel}
        </div>
      )}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <div style={{ minHeight: '100vh', padding: '60px 40px 80px' }}>
      {/* Heading above device */}
      <div style={{
        maxWidth: 1240, margin: '0 auto 36px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
            FinApp · Fase 1 — MVP · Hi-fi prototype
          </div>
          <h1 style={{ margin: '8px 0 0', fontSize: 34, fontWeight: 500, letterSpacing: '-0.035em', color: 'var(--ink)' }}>
            Login, Dashboard & Cartões
          </h1>
          <div style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-2)', maxWidth: 620, lineHeight: 1.5 }}>
            Três telas da Fase 1 implementadas em React. Toque <span className="mono" style={{ background: '#FBFAF6', border: '1px solid var(--hairline)', borderRadius: 6, padding: '1px 6px' }}>Entrar</span> na esquerda para navegar até o dashboard, depois explore a aba <span className="mono" style={{ background: '#FBFAF6', border: '1px solid var(--hairline)', borderRadius: 6, padding: '1px 6px' }}>Cartões</span>.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--muted)', fontFamily: 'Geist Mono' }}>
          <span style={{ padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 999 }}>390×844 · iPhone 14</span>
        </div>
      </div>

      {/* Two-frame side-by-side OR single */}
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap',
      }}>
        {t.showTwoFrames ? (
          <>
            <PhoneApp initialScreen="login" accent={t.accent} frameLabel="01 · Login" />
            <PhoneApp initialScreen="app"   accent={t.accent} frameLabel="02 · Dashboard & Cartões" />
          </>
        ) : (
          <PhoneApp initialScreen={t.screen === 'login' ? 'login' : 'app'} accent={t.accent} />
        )}
      </div>

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Acento">
          <TweakSelect
            label="Paleta"
            value={t.accent}
            onChange={v => setTweak('accent', v)}
            options={[
              { value: 'green',  label: 'Verde (padrão)' },
              { value: 'amber',  label: 'Âmbar' },
              { value: 'indigo', label: 'Índigo' },
              { value: 'rose',   label: 'Rosa' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Layout">
          <TweakToggle
            label="Duas telas lado a lado"
            value={t.showTwoFrames}
            onChange={v => setTweak('showTwoFrames', v)}
          />
          {!t.showTwoFrames && (
            <TweakRadio
              label="Tela ativa"
              value={t.screen}
              onChange={v => setTweak('screen', v)}
              options={[
                { value: 'login', label: 'Login' },
                { value: 'app',   label: 'Dashboard' },
              ]}
            />
          )}
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
