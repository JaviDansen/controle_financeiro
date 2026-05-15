// Login screen for the Live Server prototype.

function LoginScreen({ onSignIn }) {
  const [pressed, setPressed] = React.useState(false);

  return (
    <div style={{
      minHeight: '100%',
      background: 'var(--bg)',
      padding: '84px 26px 34px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          background: 'var(--ink)',
          color: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 18,
        }}>
          F
        </div>
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>FinApp</div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>Controle financeiro pessoal</div>
        </div>
      </div>

      <div style={{ marginTop: 74 }}>
        <h1 style={{
          margin: 0,
          fontSize: 38,
          lineHeight: 1.02,
          fontWeight: 600,
          letterSpacing: '-0.04em',
          color: 'var(--ink)',
        }}>
          Organize seu dinheiro com clareza.
        </h1>
        <p style={{
          margin: '16px 0 0',
          fontSize: 15,
          lineHeight: 1.5,
          color: 'var(--ink-2)',
        }}>
          Acompanhe saldo, cartoes, metas e ultimas movimentacoes em um so lugar.
        </p>
      </div>

      <div style={{ marginTop: 34, display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 7 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>E-mail</span>
          <input
            defaultValue="javi@finapp.com"
            style={{
              height: 52,
              borderRadius: 14,
              border: '1px solid var(--hairline)',
              background: 'var(--surface)',
              padding: '0 15px',
              fontSize: 15,
              color: 'var(--ink)',
            }}
          />
        </label>
        <label style={{ display: 'grid', gap: 7 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Senha</span>
          <input
            type="password"
            defaultValue="finapp123"
            style={{
              height: 52,
              borderRadius: 14,
              border: '1px solid var(--hairline)',
              background: 'var(--surface)',
              padding: '0 15px',
              fontSize: 15,
              color: 'var(--ink)',
            }}
          />
        </label>
      </div>

      <button
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onClick={onSignIn}
        style={{
          marginTop: 22,
          height: 54,
          borderRadius: 16,
          border: 'none',
          background: 'var(--ink)',
          color: 'var(--surface)',
          fontSize: 15,
          fontWeight: 700,
          transform: pressed ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform .12s ease',
        }}
      >
        Entrar
      </button>

      <div style={{ marginTop: 'auto', color: 'var(--muted)', fontSize: 12, lineHeight: 1.5, textAlign: 'center' }}>
        Prototipo visual para validar fluxo, hierarquia e componentes.
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen });
