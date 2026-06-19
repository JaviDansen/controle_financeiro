import { getCurrentMonth } from '../../src/lib/date'

describe('getCurrentMonth', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('retorna o mês e ano atuais formatados em português', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-17'))
    const result = getCurrentMonth()
    console.log('[junho] data simulada: 2026-06-17 → resultado:', result)
    expect(result).toBe('Junho de 2026')
  })

  it('retorna corretamente para janeiro', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-15T12:00:00'))
    const result = getCurrentMonth()
    console.log('[janeiro] data simulada: 2026-01-15 → resultado:', result)
    expect(result).toBe('Janeiro de 2026')
  })

  it('retorna corretamente para dezembro', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-12-15T12:00:00'))
    const result = getCurrentMonth()
    console.log('[dezembro] data simulada: 2025-12-15 → resultado:', result)
    expect(result).toBe('Dezembro de 2025')
  })

  it('capitaliza a primeira letra do mês', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-15'))
    const result = getCurrentMonth()
    console.log('[capitalização] resultado:', result, '→ primeira letra:', result[0])
    expect(result[0]).toBe(result[0].toUpperCase())
  })
})
