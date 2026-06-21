const EXCHANGE_API_URL = 'https://open.er-api.com/v6/latest/USD'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

let cachedRate: number | null = null
let cacheExpiresAt = 0

export async function getUsdToBrl(): Promise<number> {
  if (cachedRate !== null && Date.now() < cacheExpiresAt) {
    return cachedRate
  }

  try {
    const res = await fetch(EXCHANGE_API_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json() as { rates: Record<string, number> }
    const rate = data.rates['BRL']

    if (!rate || typeof rate !== 'number') throw new Error('BRL não encontrado na resposta')

    cachedRate = rate
    cacheExpiresAt = Date.now() + CACHE_TTL_MS
    console.log(`[exchange-rate] USD→BRL atualizado: ${rate} (válido por 24h)`)
    return rate
  } catch (err) {
    const fallback = Number(process.env.USD_TO_BRL ?? '6.10')
    console.warn(`[exchange-rate] Falha ao buscar câmbio, usando fallback R$ ${fallback}:`, err)
    return fallback
  }
}
