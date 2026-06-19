import { api } from './helpers/app'

describe('GET /health', () => {
  it('retorna status 200', async () => {
    const res = await api().get('/health')
    expect(res.status).toBe(200)
  })

  it('retorna body { status: "ok" }', async () => {
    const res = await api().get('/health')
    expect(res.body).toEqual({ status: 'ok' })
  })
})

describe('GET /hello', () => {
  it('retorna status 200', async () => {
    const res = await api().get('/hello')
    expect(res.status).toBe(200)
  })

  it('retorna body com message e env', async () => {
    const res = await api().get('/hello')
    expect(res.body).toHaveProperty('message', 'Hello World')
    expect(res.body).toHaveProperty('env')
  })
})

describe('Rota inexistente', () => {
  it('retorna status 404', async () => {
    const res = await api().get('/rota-que-nao-existe')
    expect(res.status).toBe(404)
  })
})
