// Profile screen — user account, settings, categories, sign out.

function ProfileRow({ icon, label, detail, danger, last, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 0',
        borderBottom: last ? 'none' : '1px solid var(--hairline)',
        background: 'none', border: 'none', borderRadius: 0,
        color: danger ? 'var(--neg)' : 'var(--ink)',
      }}
    >
      {icon && (
        <span style={{
          width: 32, height: 32, borderRadius: 9,
          background: danger ? 'var(--neg-soft)' : 'var(--bg)',
          color: danger ? 'var(--neg)' : 'var(--ink-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{icon}</span>
      )}
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{label}</span>
      {detail && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{detail}</span>}
      {!danger && <Icon.ChevR size={12} sw={1.8} style={{ color: 'var(--muted)' }} />}
    </button>
  );
}

function ProfileSection({ title, children }) {
  return (
    <div>
      {title && (
        <div style={{
          padding: '0 26px 6px', fontSize: 11, color: 'var(--muted)',
          letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500,
        }}>{title}</div>
      )}
      <div style={{
        margin: '0 16px', background: 'var(--surface)',
        borderRadius: 18, padding: '0 16px', border: '1px solid var(--hairline)',
      }}>{children}</div>
    </div>
  );
}

function ProfileScreen({ onSignOut }) {
  const [notif, setNotif] = React.useState(true);
  const [biometric, setBiometric] = React.useState(true);

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 38, height: 22, borderRadius: 999,
        background: value ? 'var(--ink)' : 'var(--hairline)',
        border: 'none', position: 'relative',
        transition: 'background .2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: value ? 18 : 2,
        width: 18, height: 18, borderRadius: 999,
        background: '#FBFAF6',
        transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        paddingTop: 62, paddingLeft: 22, paddingRight: 16, paddingBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
          Perfil
        </h1>
        <button style={iconBtn2}><Icon.More size={18} /></button>
      </div>

      {/* User card */}
      <div style={{ padding: '0 16px 22px' }}>
        <div style={{
          background: 'var(--ink)', color: '#FBFAF6',
          borderRadius: 22, padding: '20px',
          display: 'flex', alignItems: 'center', gap: 14,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -20, width: 160, height: 160, borderRadius: '50%',
            background: 'var(--accent)', opacity: 0.18, filter: 'blur(30px)',
          }} />
          <div style={{
            width: 58, height: 58, borderRadius: 999,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 600, letterSpacing: '0.02em',
            position: 'relative',
          }}>{USER.initials}</div>
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em' }}>{USER.name}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{USER.email}</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{USER.city} · membro desde {USER.joined}</div>
          </div>
        </div>
      </div>

      {/* Conta */}
      <div style={{ padding: '0 26px 6px', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
        Conta
      </div>
      <div style={{ margin: '0 16px 16px', background: 'var(--surface)', borderRadius: 18, padding: '0 16px', border: '1px solid var(--hairline)' }}>
        <ProfileRow icon={<Icon.Profile size={16} />} label="Dados pessoais" />
        <ProfileRow icon={<Icon.Mail size={16} />} label="E-mail" detail={USER.email} />
        <ProfileRow icon={<Icon.Lock size={16} />} label="Senha e segurança" />
        <ProfileRow icon={<Icon.Card size={16} />} label="Meus cartões" detail={`${CARDS.length}`} last />
      </div>

      {/* Personalização */}
      <div style={{ padding: '0 26px 6px', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
        Preferências
      </div>
      <div style={{ margin: '0 16px 16px', background: 'var(--surface)', borderRadius: 18, padding: '0 16px', border: '1px solid var(--hairline)' }}>
        {/* Categories */}
        <ProfileRow
          icon={<span style={{ display: 'flex', gap: 2 }}>
            <span style={{ width: 6, height: 12, borderRadius: 2, background: 'oklch(0.65 0.14 50)' }} />
            <span style={{ width: 6, height: 12, borderRadius: 2, background: 'oklch(0.55 0.13 250)' }} />
            <span style={{ width: 6, height: 12, borderRadius: 2, background: 'oklch(0.55 0.13 150)' }} />
          </span>}
          label="Categorias"
          detail={`${Object.keys(CATEGORIES).length}`}
        />
        {/* Notif toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--hairline)' }}>
          <span style={{
            width: 32, height: 32, borderRadius: 9, background: 'var(--bg)',
            color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon.Bell size={16} /></span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Notificações</span>
          <Toggle value={notif} onChange={setNotif} />
        </div>
        {/* Biometric toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
          <span style={{
            width: 32, height: 32, borderRadius: 9, background: 'var(--bg)',
            color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8C4 5 6.5 3 10 3s6 2 6 5"/>
              <path d="M4 12c0 4 3 5 6 5s6-1 6-5v-2"/>
              <path d="M10 7v5M7.5 11c0 2.5 1 4 2.5 4"/>
            </svg>
          </span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Acesso por biometria</span>
          <Toggle value={biometric} onChange={setBiometric} />
        </div>
      </div>

      {/* Suporte */}
      <div style={{ padding: '0 26px 6px', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
        Suporte
      </div>
      <div style={{ margin: '0 16px 16px', background: 'var(--surface)', borderRadius: 18, padding: '0 16px', border: '1px solid var(--hairline)' }}>
        <ProfileRow icon={<span style={{ fontWeight: 600, fontSize: 13 }}>?</span>} label="Central de ajuda" />
        <ProfileRow icon={<span style={{ fontWeight: 600, fontSize: 13 }}>!</span>} label="Reportar problema" />
        <ProfileRow icon={<span style={{ fontFamily: 'Geist Mono', fontWeight: 500, fontSize: 11 }}>i</span>} label="Sobre o FinApp" detail="v1.0.0" last />
      </div>

      {/* Sign out */}
      <div style={{ margin: '0 16px 20px', background: 'var(--surface)', borderRadius: 18, padding: '0 16px', border: '1px solid var(--hairline)' }}>
        <ProfileRow
          icon={
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h7"/>
              <path d="M9 10h8M14 7l3 3-3 3"/>
            </svg>
          }
          label="Sair da conta"
          danger
          last
          onClick={onSignOut}
        />
      </div>

      <div style={{
        textAlign: 'center', padding: '0 0 20px',
        fontSize: 11, color: 'var(--muted)', fontFamily: 'Geist Mono',
      }}>
        FinApp v1.0.0 · Maio 2026
      </div>

      <div style={{ height: 120 }} />
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
