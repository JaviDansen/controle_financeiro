import { renderHook, waitFor } from "@testing-library/react-native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"
import { useTransactions } from "../../hooks/useTransactions"
import * as transactionsService from "../../services/transactions.service"

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock("../../store/auth.store", () => ({
  useAuthStore: jest.fn((selector: (s: { token: string | null }) => unknown) =>
    selector({ token: "eyJhbGci.payload.sig" })
  ),
}))

jest.mock("../../services/transactions.service")

const MOCK_RESPONSE = {
  summary: { income: 5800, expense: 2162.47, balance: 3637.53, month: "2026-06" },
  transactions: [
    {
      id: "tx-1",
      title: "Salário",
      amount: 5800,
      type: "income" as const,
      status: "confirmed" as const,
      categoryId: "cat-1",
      categoryName: "Receita",
      categoryColor: "#3D8B4E",
      cardId: null,
      date: "2026-06-14",
      notes: null,
      isRecurring: false,
      createdAt: "2026-06-14T10:00:00Z",
    },
  ],
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("useTransactions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("chama getTransactions com o month e token corretos", async () => {
    ;(transactionsService.getTransactions as jest.Mock).mockResolvedValueOnce(MOCK_RESPONSE)

    const { result } = renderHook(() => useTransactions("2026-06"), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(transactionsService.getTransactions).toHaveBeenCalledWith(
      "2026-06",
      "eyJhbGci.payload.sig"
    )
  })

  it("expõe summary com income, expense e balance", async () => {
    ;(transactionsService.getTransactions as jest.Mock).mockResolvedValueOnce(MOCK_RESPONSE)

    const { result } = renderHook(() => useTransactions("2026-06"), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.summary?.income).toBe(5800)
    expect(result.current.summary?.expense).toBe(2162.47)
    expect(result.current.summary?.balance).toBe(3637.53)
  })

  it("expõe lista de transações", async () => {
    ;(transactionsService.getTransactions as jest.Mock).mockResolvedValueOnce(MOCK_RESPONSE)

    const { result } = renderHook(() => useTransactions("2026-06"), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions?.[0].title).toBe("Salário")
  })

  it("isLoading é true enquanto dados chegam", () => {
    ;(transactionsService.getTransactions as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    )

    const { result } = renderHook(() => useTransactions("2026-06"), {
      wrapper: makeWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })

  it("isError é true quando getTransactions lança erro", async () => {
    ;(transactionsService.getTransactions as jest.Mock).mockRejectedValueOnce(
      new Error("Token inválido ou expirado")
    )

    const { result } = renderHook(() => useTransactions("2026-06"), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("não executa query quando token está ausente", () => {
    const { useAuthStore } = require("../../store/auth.store")
    ;(useAuthStore as jest.Mock).mockImplementationOnce(
      (selector: (s: { token: string | null }) => unknown) => selector({ token: null })
    )

    const { result } = renderHook(() => useTransactions("2026-06"), {
      wrapper: makeWrapper(),
    })

    expect(transactionsService.getTransactions).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it("usa queryKey ['transactions', month] para cache correto", async () => {
    ;(transactionsService.getTransactions as jest.Mock).mockResolvedValue(MOCK_RESPONSE)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useTransactions("2026-06"), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(["transactions", "2026-06"])
    expect(cached).toBeDefined()
  })
})
