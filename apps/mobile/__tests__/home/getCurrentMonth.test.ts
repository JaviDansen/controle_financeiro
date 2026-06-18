import { getCurrentMonth } from '../../src/lib/date'

describe('getCurrentMonth', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('retorna o mês e ano atuais formatados em português', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-17'))
    expect(getCurrentMonth()).toBe('Junho de 2026')
  })

  it('retorna corretamente para janeiro', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-15T12:00:00'))
    expect(getCurrentMonth()).toBe('Janeiro de 2026')
  })

  it('retorna corretamente para dezembro', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-12-15T12:00:00'))
    expect(getCurrentMonth()).toBe('Dezembro de 2025')
  })

  it('capitaliza a primeira letra do mês', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-15'))
    const result = getCurrentMonth()
    expect(result[0]).toBe(result[0].toUpperCase())
  })
})
