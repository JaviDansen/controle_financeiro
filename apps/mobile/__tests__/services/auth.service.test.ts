const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"

import * as authService from "../../services/auth.service"

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe("authService.login", () => {
  it("faz POST para /auth/login com email e senha", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          token: "eyJhbGci.payload.sig",
          user: { id: "uuid-1", name: "Joao", email: "joao@teste.com" },
        },
      }),
    })

    const result = await authService.login("joao@teste.com", "senha123")

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/auth/login`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email: "joao@teste.com", password: "senha123" }),
      })
    )
    expect(result.token).toBe("eyJhbGci.payload.sig")
    expect(result.user.email).toBe("joao@teste.com")
  })

  it("lanca erro com mensagem da API quando credenciais invalidas", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Credenciais invalidas" }),
    })

    await expect(authService.login("joao@teste.com", "errada")).rejects.toThrow(
      "Credenciais invalidas"
    )
  })
})

describe("authService.register", () => {
  it("faz POST para /auth/register com name, email e password", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          id: "uuid-1",
          name: "Joao",
          email: "joao@teste.com",
          createdAt: new Date().toISOString(),
        },
      }),
    })

    const result = await authService.register("Joao", "joao@teste.com", "senha123")

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/auth/register`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Joao", email: "joao@teste.com", password: "senha123" }),
      })
    )
    expect(result.email).toBe("joao@teste.com")
  })

  it("lanca erro quando email ja cadastrado", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Email ja cadastrado" }),
    })

    await expect(
      authService.register("Joao", "joao@teste.com", "senha123")
    ).rejects.toThrow("Email ja cadastrado")
  })
})

describe("authService.forgotPassword", () => {
  it("faz POST para /auth/forgot-password com o email", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { message: "Se esse e-mail existir, voce recebera um link." },
      }),
    })

    await authService.forgotPassword("joao@teste.com")

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/auth/forgot-password`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "joao@teste.com" }),
      })
    )
  })
})
