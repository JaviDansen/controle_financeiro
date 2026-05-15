// Register screen — FinApp. Mirrors Login composition.

function RegisterScreen({ onCreated, onBack }) {
  const [nome, setNome] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [confirma, setConfirma] = React.useState('');
  const [accept, setAccept] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const submit = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onCreated(); }, 700);
  };

  return (
    <div style={{
      height: '100%', width: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      paddingTop: 64,
    }}>
      <div style={{ padding: '20px 22px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            width: 38, height: 38, borderRadius: 999,
            background: 'var(--surface)', border: '1px solid var(--hairline)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink)',
          }}
        ><Icon.ChevL size={16} /></button>
        <FinAppMark size={22} />
      </div>

      <div style={{ padding: '24px 28px 18px' }}>
        <h1 style={{
          margin: 0, fontSize: 28, lineHeight: 1.05, fontWeight: 500,
          letterSpacing: '-0.035em', color: 'var(--ink)',
        }}>Criar sua conta</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
          Leva menos de um minuto. Você poderá começar a registrar transações agora mesmo.
        </p>
      </div>

      <div style={{
        flex: 1, background: 'var(--surface)',
        borderRadius: '28px 28px 0 0',
        padding: '24px 22px 24px',
        boxShadow: '0 -1px 0 var(--hairline)',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <Field label="Nome completo" value={nome} onChange={setNome} placeholder="Walber Vidigal" icon={<Icon.Profile size={18}/>} />
        <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" icon={<Icon.Mail size={18}/>} />
        <Field label="Senha" type="password" value={senha} onChange={setSenha} placeholder="mínimo 8 caracteres" icon={<Icon.Lock size={18}/>} />
        <Field label="Confirmar senha" type="password" value={confirma} onChange={setConfirma} placeholder="repita a senha" icon={<Icon.Lock size={18}/>} />

        <button
          onClick={() => setAccept(!accept)}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 4,
            background: 'none', border: 'none', padding: 0, color: 'var(--ink-2)',
            fontSize: 13, textAlign: 'left', lineHeight: 1.5,
          }}
        >
          <span style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
            border: `1.5px solid ${accept ? 'var(--accent)' : 'var(--hairline)'}`,
            background: accept ? 'var(--accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            marginTop: 1,
          }}>{accept && <Icon.Check size={12} sw={2.5} />}</span>
          <span>Eu li e aceito os <span style={{ color: 'var(--ink)', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 3 }}>Termos de uso</span> e a <span style={{ color: 'var(--ink)', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 3 }}>Política de privacidade</span></span>
        </button>

        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: 6, height: 54, borderRadius: 16, border: 'none',
            background: 'var(--ink)', color: 'var(--surface)',
            fontSize: 15, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Criando…' : <>Criar conta <Icon.ChevR size={16} sw={2} /></>}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-2)', marginTop: 8 }}>
          Já tem conta? <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--ink)', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 3 }}>Entrar</button>
        </div>
      </div>
    </div>
  );
}

window.RegisterScreen = RegisterScreen;
