const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"

import * as cardsService from "../../services/cards.service"

const MOCK_CARD = {
  id: "card-uuid-1",
  name: "Roxinho",
  bank: "Nubank",
  type: "credit" as const,
  last4: "4218",
  holder: "JOAO TESTE",
  expiry: "08/29",
  limit: 8500,
  closingDay: 16,
  dueDay: 23,
  bestPurchaseDate: "2026-06-19",
  used: 1240,
  currentMonthTotal: 1240,
  openInstallmentsCount: 0,
  openInstallmentsTotal: 0,
  gradientColors: ["#6B2D8C", "#3B0F66"] as [string, string],
  accent: "#C77BF0",
}

const TOKEN = "eyJhbGci.payload.sig"

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe("cardsService.getCards", () => {
  it("faz GET para /cards com header Authorization", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [MOCK_CARD] }),
    })

    await cardsService.getCards(TOKEN)

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/cards`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      })
    )
  })

  it("retorna array de cartões com dados da API", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [MOCK_CARD] }),
    })

    const result = await cardsService.getCards(TOKEN)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Roxinho")
    expect(result[0].bank).toBe("Nubank")
    expect(result[0].gradientColors).toHaveLength(2)
  })

  it("retorna array vazio quando usuário não tem cartões", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    })

    const result = await cardsService.getCards(TOKEN)
    expect(result).toEqual([])
  })

  it("lança erro quando API retorna 401", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Token inválido ou expirado" }),
    })

    await expect(cardsService.getCards(TOKEN)).rejects.toThrow("Token inválido ou expirado")
  })
})

describe("cardsService.createCard", () => {
  const NEW_CARD = {
    name: "Roxinho",
    bank: "Nubank",
    type: "credit" as const,
    lastFour: "4218",
    holder: "JOAO TESTE",
    expiry: "08/29",
    creditLimit: 8500,
    closingDay: 16,
    dueDay: 23,
    gradientFrom: "#6B2D8C",
    gradientTo: "#3B0F66",
    accent: "#C77BF0",
  }

  it("faz POST para /cards com dados do cartão e token", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "card-1", ...NEW_CARD } }),
    })

    await cardsService.createCard(NEW_CARD, TOKEN)

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/cards`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        }),
        body: JSON.stringify(NEW_CARD),
      })
    )
  })

  it("retorna cartão criado", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "card-1", ...NEW_CARD, createdAt: new Date().toISOString() } }),
    })

    const result = await cardsService.createCard(NEW_CARD, TOKEN)
    expect(result.id).toBe("card-1")
    expect(result.name).toBe("Roxinho")
  })

  it("lança erro quando API retorna erro", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "name é obrigatório" }),
    })

    await expect(cardsService.createCard(NEW_CARD, TOKEN)).rejects.toThrow("name é obrigatório")
  })
})
