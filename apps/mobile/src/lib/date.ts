export function getCurrentMonth(): string {
  const raw = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

export function getCurrentMonthParam(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
