// login_example.tsx
// FinApp — Login screen + tudo que ela precisa, em um único arquivo TSX.
//
// Inclui:
//   • Tipos TypeScript
//   • Ícones SVG (Mail, Lock, Eye, EyeOff, Check, ChevR)
//   • <FinAppMark> — wordmark "fin·app"
//   • <Field> — input estilizado com label, ícone e trailing slot
//   • <LoginScreen> — composição completa
//   • CSS vars + keyframe injetados via <style>
//
// Uso:
//   import LoginScreen from './login_example';
//   <LoginScreen onSignIn={() => {}} onCreateAccount={() => {}} onForgot={() => {}} />

import React, { useState } from 'react';

/* ─── Tipos ───────────────────────────────────────────────── */

interface IconProps {
  size?: number;
  sw?: number;
}

interface FieldProps {
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  placeholder?: string;
}

interface FinAppMarkProps {
  size?: number;
  dark?: boolean;
}

interface LoginScreenProps {
  onSignIn?: () => void;
  onCreateAccount?: () => void;
  onForgot?: () => void;
  onGoogle?: () => void;
}

/* ─── Estilos globais (CSS vars + keyframe) ──────────────── */

const FINAPP_CSS = `
  :root {
    --bg: #ECE7DC;
    --surface: #FBFAF6;
    --ink: #15151A;
    --ink-2: #3B3B43;
    --muted: #8B8B92;
    --hairline: #1515151A;
    --accent: oklch(0.55 0.13 150);
    --accent-soft: oklch(0.92 0.04 150);
    --accent-ink: oklch(0.32 0.09 150);
  }
  .finapp-mono {
    font-family: 'Geist Mono', ui-monospace, monospace;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  @keyframes finapp-spin { to { transform: rotate(360deg); } }
`;

function GlobalStyle(): React.ReactElement {
  return <style dangerouslySetInnerHTML={{ __html: FINAPP_CSS }} />;
}

/* ─── Ícones ──────────────────────────────────────────────── */

const Icon = {
  Mail: ({ size = 16, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none"
         stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="M3 6l7 5 7-5" />
    </svg>
  ),
  Lock: ({ size = 16, sw = 1.6 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none"
         stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="9" width="12" height="8" rx="2" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  ),
  Eye: ({ size = 18, sw = 1.5 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none"
         stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 10s3-6 8.5-6 8.5 6 8.5 6-3 6-8.5 6S1.5 10 1.5 10Z" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  ),
  EyeOff: ({ size = 18, sw = 1.5 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none"
         stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l14 14" />
      <path d="M6.5 5.5C7.6 4.9 8.7 4.5 10 4.5c5.5 0 8.5 5.5 8.5 5.5a14 14 0 0 1-2.5 3" />
      <path d="M13.5 13.5A4 4 0 0 1 6.5 6.5" />
      <path d="M1.5 10s1.4-2.7 4.3-4.5" />
    </svg>
  ),
  Check: ({ size = 14, sw = 2.2 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none"
         stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  ),
  ChevR: ({ size = 14, sw = 1.8 }: IconProps): React.ReactElement => (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none"
         stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4l6 6-6 6" />
    </svg>
  ),
};

/* ─── Wordmark ────────────────────────────────────────────── */

export function FinAppMark({ size = 32, dark = false }: FinAppMarkProps): React.ReactElement {
  const ink = dark ? '#FBFAF6' : '#15151A';
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 0,
      fontFamily: "'Geist', -apple-system, system-ui, sans-serif",
      color: ink,
    }}>
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

/* ─── Field ───────────────────────────────────────────────── */

export function Field({
  label, type = 'text', value, onChange, icon, trailing, placeholder,
}: FieldProps): React.ReactElement {
  const [focused, setFocused] = useState<boolean>(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 12, fontWeight: 500, color: 'var(--muted)',
        letterSpacing: '0.02em', textTransform: 'uppercase',
      }}>
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontSize: 16, color: 'var(--ink)', minWidth: 0,
            fontFamily: type === 'password' ? "'Geist Mono', ui-monospace, monospace" : "'Geist', system-ui, sans-serif",
            letterSpacing: type === 'password' ? '0.15em' : 'normal',
          }}
        />
        {trailing}
      </div>
    </div>
  );
}

/* ─── Login screen ────────────────────────────────────────── */

export default function LoginScreen({
  onSignIn,
  onCreateAccount,
  onForgot,
  onGoogle,
}: LoginScreenProps): React.ReactElement {
  const [email, setEmail] = useState<string>('walber@brisanet.com');
  const [password, setPassword] = useState<string>('••••••••••');
  const [showPwd, setShowPwd] = useState<boolean>(false);
  const [remember, setRemember] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const submit = (): void => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      onSignIn?.();
    }, 700);
  };

  return (
    <>
      <GlobalStyle />
      <div style={{
        height: '100%', width: '100%',
        background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        paddingTop: 64, // espaço para a status bar
        fontFamily: "'Geist', -apple-system, system-ui, sans-serif",
        color: 'var(--ink)',
        WebkitFontSmoothing: 'antialiased',
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
              Bem-vindo<br />de volta, Walber.
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5, maxWidth: 280 }}>
              Entre para retomar o controle das suas finanças deste mês.
            </p>
          </div>
        </div>

        {/* Form card */}
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
                type="button"
                style={{
                  background: 'none', border: 'none', padding: 4,
                  color: 'var(--muted)', display: 'flex', cursor: 'pointer',
                }}
              >
                {showPwd ? <Icon.EyeOff size={18} /> : <Icon.Eye size={18} />}
              </button>
            }
            placeholder="••••••••"
          />

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2,
          }}>
            <button
              onClick={() => setRemember(!remember)}
              type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', padding: 0,
                color: 'var(--ink-2)', fontSize: 13, cursor: 'pointer',
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
            <button
              onClick={onForgot}
              type="button"
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 13, color: 'var(--ink)', fontWeight: 500,
                textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer',
              }}
            >
              Esqueci a senha
            </button>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            type="button"
            style={{
              marginTop: 10,
              height: 56, borderRadius: 16, border: 'none',
              background: 'var(--ink)', color: 'var(--surface)',
              fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'opacity .15s',
              opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16, borderRadius: 999,
                  border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                  animation: 'finapp-spin .8s linear infinite',
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
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '12px 0 4px', color: 'var(--muted)', fontSize: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
            <span>ou</span>
            <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
          </div>

          <button
            onClick={onGoogle}
            type="button"
            style={{
              height: 52, borderRadius: 14, border: '1px solid var(--hairline)',
              background: 'transparent', color: 'var(--ink)',
              fontSize: 15, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <span style={{
              width: 18, height: 18, borderRadius: 4,
              background: 'var(--ink)', color: 'var(--surface)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              fontFamily: "'Geist Mono', ui-monospace, monospace",
            }}>G</span>
            Continuar com Google
          </button>

          <div style={{
            textAlign: 'center', fontSize: 13,
            color: 'var(--ink-2)', marginTop: 'auto', paddingTop: 12,
          }}>
            Não tem conta?{' '}
            <button
              onClick={onCreateAccount}
              type="button"
              style={{
                background: 'none', border: 'none', padding: 0,
                color: 'var(--ink)', fontWeight: 500,
                textDecoration: 'underline', textUnderlineOffset: 3,
                fontSize: 13, cursor: 'pointer',
              }}
            >
              Criar conta
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
