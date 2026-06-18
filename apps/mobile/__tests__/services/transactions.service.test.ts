const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"

import * as transactionsService from "../../services/transactions.service"

const TOKEN = "eyJhbGci.payload.sig"

const MOCK_TRANSACTION = {
  id: "tx-uuid-1",
  title: "Mercado Pão de Açúcar",
  amount: 312.47,
  type: "expense" as const,
  status: "confirmed" as const,
  categoryId: "cat-uuid-1",
  categoryName: "Alimentação",
  categoryColor: "#C07830",
  cardId: "card-uuid-1",
  date: "2026-06-12",
  notes: null,
  isRecurring: false,
  createdAt: "2026-06-12T15:30:00Z",
}

const MOCK_SUMMARY = {
  income: 5800,
  expense: 2162.47,
  balance: 3637.53,
  month: "2026-06",
}

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.resetAllMocks()
})

// ─────────────────────────────────────────────────────
// getTransactions
// ─────────────────────────────────────────────────────

describe("transactionsService.getTransactions", () => {
  it("faz GET para /transactions com Authorization e month corretos", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { summary: MOCK_SUMMARY, transactions: [MOCK_TRANSACTION] },
      }),
    })

    await transactionsService.getTransactions("2026-06", TOKEN)

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/transactions?month=2026-06`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      })
    )
  })

  it("retorna summary e lista de transações", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { summary: MOCK_SUMMARY, transactions: [MOCK_TRANSACTION] },
      }),
    })

    const result = await transactionsService.getTransactions("2026-06", TOKEN)

    expect(result.summary.income).toBe(5800)
    expect(result.summary.expense).toBe(2162.47)
    expect(result.summary.balance).toBe(3637.53)
    expect(result.summary.month).toBe("2026-06")
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0].title).toBe("Mercado Pão de Açúcar")
  })

  it("retorna lista vazia e summary zerado quando não há transações no mês", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          summary: { income: 0, expense: 0, balance: 0, month: "2026-06" },
          transactions: [],
        },
      }),
    })

    const result = await transactionsService.getTransactions("2026-06", TOKEN)

    expect(result.transactions).toEqual([])
    expect(result.summary.balance).toBe(0)
  })

  it("lança erro quando API retorna 401", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Token inválido ou expirado" }),
    })

    await expect(
      transactionsService.getTransactions("2026-06", TOKEN)
    ).rejects.toThrow("Token inválido ou expirado")
  })

  it("lança erro quando month está ausente", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "month deve estar no formato YYYY-MM" }),
    })

    await expect(
      transactionsService.getTransactions("", TOKEN)
    ).rejects.toThrow()
  })
})

// ─────────────────────────────────────────────────────
// createTransaction
// ─────────────────────────────────────────────────────

describe("transactionsService.createTransaction", () => {
  const PAYLOAD = {
    title: "Mercado Pão de Açúcar",
    amount: 312.47,
    type: "expense" as const,
    categoryId: "cat-uuid-1",
    cardId: "card-uuid-1",
    date: "2026-06-12",
    notes: "",
    isRecurring: false,
    status: "confirmed" as const,
  }

  it("faz POST para /transactions com body e token corretos", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "tx-1", ...PAYLOAD, createdAt: "2026-06-12T15:30:00Z" } }),
    })

    await transactionsService.createTransaction(PAYLOAD, TOKEN)

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/transactions`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        }),
        body: JSON.stringify(PAYLOAD),
      })
    )
  })

  it("retorna a transação criada com id", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { id: "tx-uuid-novo", ...PAYLOAD, createdAt: "2026-06-12T15:30:00Z" },
      }),
    })

    const result = await transactionsService.createTransaction(PAYLOAD, TOKEN)

    expect(result.id).toBe("tx-uuid-novo")
    expect(result.title).toBe("Mercado Pão de Açúcar")
    expect(result.amount).toBe(312.47)
  })

  it("lança erro quando API retorna 400", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "amount deve ser positivo" }),
    })

    await expect(
      transactionsService.createTransaction({ ...PAYLOAD, amount: -100 }, TOKEN)
    ).rejects.toThrow("amount deve ser positivo")
  })
})

// ─────────────────────────────────────────────────────
// updateTransaction
// ─────────────────────────────────────────────────────

describe("transactionsService.updateTransaction", () => {
  it("faz PUT para /transactions/:id com partial body e token", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { ...MOCK_TRANSACTION, title: "Título atualizado" },
      }),
    })

    await transactionsService.updateTransaction("tx-uuid-1", { title: "Título atualizado" }, TOKEN)

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/transactions/tx-uuid-1`,
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
        body: JSON.stringify({ title: "Título atualizado" }),
      })
    )
  })

  it("retorna transação com dados atualizados", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { ...MOCK_TRANSACTION, title: "Título atualizado" },
      }),
    })

    const result = await transactionsService.updateTransaction(
      "tx-uuid-1",
      { title: "Título atualizado" },
      TOKEN
    )

    expect(result.title).toBe("Título atualizado")
  })

  it("lança erro quando transação não pertence ao usuário", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Transacao nao encontrada" }),
    })

    await expect(
      transactionsService.updateTransaction("tx-outro-usuario", { title: "X" }, TOKEN)
    ).rejects.toThrow("Transacao nao encontrada")
  })
})

// ─────────────────────────────────────────────────────
// deleteTransaction
// ─────────────────────────────────────────────────────

describe("transactionsService.deleteTransaction", () => {
  it("faz DELETE para /transactions/:id com token", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    })

    await transactionsService.deleteTransaction("tx-uuid-1", TOKEN)

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/transactions/tx-uuid-1`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      })
    )
  })

  it("lança erro quando transação não existe", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Transacao nao encontrada" }),
    })

    await expect(
      transactionsService.deleteTransaction("tx-inexistente", TOKEN)
    ).rejects.toThrow("Transacao nao encontrada")
  })
})
