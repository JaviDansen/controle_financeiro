import { buildConnectionString, getConnectionLabel } from '@finapp/db'

describe('buildConnectionString()', () => {
  const saved: Record<string, string | undefined> = {}
  const keys = ['DATABASE_URL', 'DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_NAME']

  beforeEach(() => {
    keys.forEach(k => { saved[k] = process.env[k] })
  })

  afterEach(() => {
    keys.forEach(k => {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    })
  })

  it('retorna DATABASE_URL diretamente quando definida', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@host:5432/db'
    expect(buildConnectionString()).toBe('postgres://user:pass@host:5432/db')
  })

  it('monta connection string a partir dos parâmetros individuais', () => {
    delete process.env.DATABASE_URL
    process.env.DATABASE_HOST = 'localhost'
    process.env.DATABASE_PORT = '5432'
    process.env.DATABASE_USER = 'user'
    process.env.DATABASE_PASSWORD = 'pass'
    process.env.DATABASE_NAME = 'finapp'
    expect(buildConnectionString()).toBe('postgresql://user:pass@localhost:5432/finapp')
  })

  it('usa porta 5432 como padrão quando DATABASE_PORT não está definida', () => {
    delete process.env.DATABASE_URL
    delete process.env.DATABASE_PORT
    process.env.DATABASE_HOST = 'localhost'
    process.env.DATABASE_USER = 'user'
    process.env.DATABASE_PASSWORD = 'pass'
    process.env.DATABASE_NAME = 'finapp'
    expect(buildConnectionString()).toContain(':5432/')
  })

  it('codifica caracteres especiais na senha', () => {
    delete process.env.DATABASE_URL
    process.env.DATABASE_HOST = 'localhost'
    process.env.DATABASE_PORT = '5432'
    process.env.DATABASE_USER = 'user'
    process.env.DATABASE_PASSWORD = 'p@ss#1234'
    process.env.DATABASE_NAME = 'finapp'
    const result = buildConnectionString()
    expect(result).toContain(encodeURIComponent('p@ss#1234'))
    expect(result).not.toContain('p@ss#1234')
  })

  it('lança erro quando nenhuma configuração de banco está definida', () => {
    keys.forEach(k => delete process.env[k])
    expect(() => buildConnectionString()).toThrow()
  })
})

describe('getConnectionLabel()', () => {
  const saved: Record<string, string | undefined> = {}
  const keys = ['DATABASE_URL', 'DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_NAME']

  beforeEach(() => {
    keys.forEach(k => { saved[k] = process.env[k] })
  })

  afterEach(() => {
    keys.forEach(k => {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    })
  })

  it('extrai host:port/path de DATABASE_URL', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@myhost:9567/finapp-db?sslmode=disable'
    expect(getConnectionLabel()).toBe('myhost:9567/finapp-db')
  })

  it('usa parâmetros individuais quando DATABASE_URL não está definida', () => {
    delete process.env.DATABASE_URL
    process.env.DATABASE_HOST = 'myhost'
    process.env.DATABASE_PORT = '9567'
    process.env.DATABASE_NAME = 'finapp'
    expect(getConnectionLabel()).toBe('myhost:9567/finapp')
  })

  it('usa porta 5432 como padrão no label quando DATABASE_PORT ausente', () => {
    delete process.env.DATABASE_URL
    delete process.env.DATABASE_PORT
    process.env.DATABASE_HOST = 'myhost'
    process.env.DATABASE_NAME = 'finapp'
    expect(getConnectionLabel()).toBe('myhost:5432/finapp')
  })

  it('retorna mensagem de erro para DATABASE_URL com formato inválido', () => {
    process.env.DATABASE_URL = 'string-invalida'
    expect(getConnectionLabel()).toBe('connection string inválida')
  })
})
