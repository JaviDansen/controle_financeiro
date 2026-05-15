// Goals (Metas) screen — list of financial goals with progress.

function GoalCard({ goal }) {
  const pct = Math.min(1, goal.current / goal.target);
  const remaining = goal.target - goal.current;
  const done = goal.current >= goal.target;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--hairline)',
      borderRadius: 20, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          background: `color-mix(in oklch, ${goal.color} 14%, white)`,
          color: goal.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Geist Mono', fontSize: 18, fontWeight: 600,
          flexShrink: 0,
        }}>{goal.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{goal.title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            {done ? (
              <>
                <span style={{ color: 'var(--pos)', fontWeight: 500 }}>● Concluída</span>
              </>
            ) : (
              <>
                <Icon.Calendar size={11} sw={1.6} />
                <span>{goal.deadline}</span>
                {goal.daysLeft != null && <span>· {goal.daysLeft} dias</span>}
              </>
            )}
          </div>
        </div>
        <button style={{
          background: 'none', border: 'none', padding: 6, color: 'var(--muted)', display: 'flex', borderRadius: 999,
        }}><Icon.More size={16} /></button>
      </div>

      {/* progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div className="mono" style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            R$ {fmtBRLShort(goal.current)}
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
            de R$ {fmtBRLShort(goal.target)}
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--hairline)', overflow: 'hidden' }}>
          <div style={{
            width: `${pct * 100}%`, height: '100%',
            background: done ? 'var(--pos)' : goal.color,
            borderRadius: 4, transition: 'width .3s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
          <span className="mono" style={{ color: goal.color, fontWeight: 500 }}>{Math.round(pct * 100)}%</span>
          {!done && (
            <span style={{ color: 'var(--muted)' }}>Faltam R$ {fmtBRLShort(remaining)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalsScreen() {
  const active = GOALS.filter(g => g.active);
  const completed = GOALS.filter(g => !g.active);
  const totalSaved = GOALS.reduce((s, g) => s + g.current, 0);
  const totalTarget = GOALS.reduce((s, g) => s + g.target, 0);
  const overallPct = totalSaved / totalTarget;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        paddingTop: 62, paddingLeft: 22, paddingRight: 16, paddingBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
          Metas
        </h1>
        <button style={{
          height: 38, padding: '0 12px 0 10px', borderRadius: 999,
          background: 'var(--ink)', color: '#FBFAF6', border: 'none',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 500,
        }}>
          <Icon.Plus size={16} sw={2.2} /> Nova meta
        </button>
      </div>

      {/* Overall progress hero */}
      <div style={{ padding: '0 16px 4px' }}>
        <div style={{
          background: 'var(--ink)', color: '#FBFAF6',
          borderRadius: 22, padding: '18px 20px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -20, width: 180, height: 180, borderRadius: '50%',
            background: 'var(--accent)', opacity: 0.18, filter: 'blur(40px)',
          }} />
          <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, position: 'relative' }}>
            Progresso geral
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6, position: 'relative' }}>
            <span style={{ fontSize: 16, opacity: 0.6 }}>R$</span>
            <span className="mono" style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {fmtBRLShort(totalSaved)}
            </span>
            <span className="mono" style={{ fontSize: 13, opacity: 0.6, marginLeft: 4 }}>
              / {fmtBRLShort(totalTarget)}
            </span>
          </div>
          <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: `${overallPct * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, opacity: 0.7, position: 'relative' }}>
            <span>{active.length} ativas · {completed.length} concluídas</span>
            <span className="mono">{Math.round(overallPct * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Active goals */}
      <div style={{ padding: '24px 22px 6px' }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Em andamento
        </h2>
      </div>
      <div style={{ padding: '4px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {active.map(g => <GoalCard key={g.id} goal={g} />)}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <>
          <div style={{ padding: '20px 22px 6px' }}>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Concluídas
            </h2>
          </div>
          <div style={{ padding: '4px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {completed.map(g => <GoalCard key={g.id} goal={g} />)}
          </div>
        </>
      )}

      <div style={{ height: 120 }} />
    </div>
  );
}

window.GoalsScreen = GoalsScreen;
