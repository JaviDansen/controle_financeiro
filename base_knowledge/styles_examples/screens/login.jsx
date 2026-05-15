// Login screen — FinApp
// Composition: large wordmark + tagline up top, then form card.
// Original brand mark: lowercase "fin·app" with a small inset green dot for the period.

function FinAppMark({ size = 32, dark = false }) {
  const ink = dark ? '#FBFAF6' : '#15151A';
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, fontFamily: 'Geist', color: ink }}>
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

function Field({ label, type = 'text', value, onChange, icon, trailing, placeholder }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
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
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontSize: 16, color: 'var(--ink)', minWidth: 0,
            fontFamily: type === 'password' ? 'Geist Mono' : 'Geist',
            letterSpacing: type === 'password' ? '0.15em' : 'normal',
          }}
        />
        {trailing}
      </div>
    </div>
  );
}

function LoginScreen({ onSignIn, onCreateAccount }) {
  const [email, setEmail] = React.useState('walber@brisanet.com');
  const [password, setPassword] = React.useState('••••••••••');
  const [showPwd, setShowPwd] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const submit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSignIn();
    }, 700);
  };

  return (
    <div style={{
      height: '100%', width: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      paddingTop: 64, // status bar
    }}>
      {/* Hero / brand area */}
      <div style={{
        padding: '36px 28px 28px',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <FinAppMark size={36} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 28 }}>
          <h1 style={{
            margin: 0, fontSize: 34, lineHeight: 1.05, fontWeight: 500,
            letterSpacing: '-0.035em', color: 'var(--ink)',
            textWrap: 'pretty',
          }}>
            Bem-vindo<br/>de volta, Walber.
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 280 }}>
            Entre para retomar o controle das suas finanças deste mês.
          </p>
        </div>
      </div>

      {/* Form card — slightly elevated, takes the rest */}
      <div style={{
        flex: 1, background: 'var(--surface)',
        borderRadius: '28px 28px 0 0',
        padding: '32px 24px 28px',
        boxShadow: '0 -1px 0 var(--hairline), 0 -20px 40px rgba(21,21,26,0.05)',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <Field
          label="E-mail"
          type="email"
          value={email}
          onChange={setEmail}
          icon={<Icon.Mail size={18} />}
          placeholder="seu@email.com"
        />
        <Field
          label="Senha"
          type={showPwd ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          icon={<Icon.Lock size={18} />}
          trailing={
            <button
              onClick={() => setShowPwd(!showPwd)}
              style={{ background: 'none', border: 'none', padding: 4, color: 'var(--muted)', display: 'flex' }}
            >
              {showPwd ? <Icon.EyeOff size={18} /> : <Icon.Eye size={18} />}
            </button>
          }
          placeholder="••••••••"
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <button
            onClick={() => setRemember(!remember)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', padding: 0, color: 'var(--ink-2)', fontSize: 13,
            }}
          >
            <span style={{
              width: 18, height: 18, borderRadius: 5,
              border: `1.5px solid ${remember ? 'var(--accent)' : 'var(--hairline)'}`,
              background: remember ? 'var(--accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              transition: 'all .15s',
            }}>
              {remember && <Icon.Check size={12} sw={2.5} />}
            </span>
            Manter conectado
          </button>
          <button style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, color: 'var(--ink)', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Esqueci a senha
          </button>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: 10,
            height: 56, borderRadius: 16, border: 'none',
            background: 'var(--ink)', color: 'var(--surface)',
            fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'transform .1s ease, opacity .15s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: 16, height: 16, borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                animation: 'spin .8s linear infinite',
              }} />
              Entrando…
            </>
          ) : (
            <>
              Entrar
              <Icon.ChevR size={16} sw={2} />
            </>
          )}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 4px', color: 'var(--muted)', fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
          <span>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
        </div>

        <button style={{
          height: 52, borderRadius: 14, border: '1px solid var(--hairline)',
          background: 'transparent', color: 'var(--ink)', fontSize: 15, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span style={{
            width: 18, height: 18, borderRadius: 4, background: 'var(--ink)', color: 'var(--surface)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, fontFamily: 'Geist Mono',
          }}>G</span>
          Continuar com Google
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-2)', marginTop: 'auto', paddingTop: 12 }}>
          Não tem conta? <button onClick={onCreateAccount} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--ink)', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 3, fontSize: 13, cursor: 'pointer' }}>Criar conta</button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

window.LoginScreen = LoginScreen;
window.FinAppMark = FinAppMark;
