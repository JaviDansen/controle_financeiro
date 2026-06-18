export function getCurrentMonth(): string {
  const raw = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}
