﻿import React from "react"
import { render, fireEvent, waitFor, act } from "@testing-library/react-native"

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  Link: ({ children }: any) => children,
}))

jest.mock("@expo/vector-icons", () => ({
  Feather: () => null,
}))

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock("../../services/auth.service", () => ({
  login: jest.fn(),
}))

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(), signIn: jest.fn() },
  statusCodes: {},
}))

import LoginScreen from "../../app/(auth)/login"
import * as authService from "../../services/auth.service"
import { useAuthStore } from "../../store/auth.store"

beforeEach(() => {
  jest.clearAllMocks()
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
})

describe("LoginScreen — renderizacao", () => {
  it("renderiza campo de email", () => {
    const { getByPlaceholderText } = render(<LoginScreen />)
    expect(getByPlaceholderText("seu@email.com")).toBeTruthy()
  })

  it("renderiza botao de entrar", () => {
    const { getByText } = render(<LoginScreen />)
    expect(getByText("Entrar")).toBeTruthy()
  })
})

describe("LoginScreen — validacao Zod", () => {
  it("exibe erro quando email e invalido e usuario tenta submeter", async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText("seu@email.com"), "nao-e-email")
    fireEvent.changeText(getByPlaceholderText("••••••••"), "senha123")
    fireEvent.press(getByText("Entrar"))

    await waitFor(() => {
      expect(getByText("E-mail inválido")).toBeTruthy()
    })
  })

  it("exibe erro quando senha tem menos de 8 caracteres", async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText("seu@email.com"), "joao@teste.com")
    fireEvent.changeText(getByPlaceholderText("••••••••"), "123456")
    fireEvent.press(getByText("Entrar"))

    await waitFor(() => {
      expect(getByText("A senha deve ter no mínimo 8 caracteres")).toBeTruthy()
    })
  })
})

describe("LoginScreen — integracao com service", () => {
  it("chama authService.login ao submeter formulario valido", async () => {
    ;(authService.login as jest.Mock).mockResolvedValueOnce({
      token: "eyJhbGci.payload.sig",
      user: { id: "uuid-1", name: "Joao", email: "joao@teste.com" },
    })

    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText("seu@email.com"), "joao@teste.com")
    fireEvent.changeText(getByPlaceholderText("••••••••"), "senha123")

    await act(async () => {
      fireEvent.press(getByText("Entrar"))
    })

    expect(authService.login).toHaveBeenCalledWith("joao@teste.com", "senha123")
  })

  it("salva token no store apos login bem-sucedido", async () => {
    ;(authService.login as jest.Mock).mockResolvedValueOnce({
      token: "eyJhbGci.payload.sig",
      user: { id: "uuid-1", name: "Joao", email: "joao@teste.com" },
    })

    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText("seu@email.com"), "joao@teste.com")
    fireEvent.changeText(getByPlaceholderText("••••••••"), "senha123")

    await act(async () => {
      fireEvent.press(getByText("Entrar"))
    })

    expect(useAuthStore.getState().token).toBe("eyJhbGci.payload.sig")
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it("exibe mensagem de erro da API quando login falha com 401", async () => {
    ;(authService.login as jest.Mock).mockRejectedValueOnce(
      new Error("Credenciais invalidas")
    )

    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText("seu@email.com"), "joao@teste.com")
    fireEvent.changeText(getByPlaceholderText("••••••••"), "senha123")

    await act(async () => {
      fireEvent.press(getByText("Entrar"))
    })

    await waitFor(() => {
      expect(getByText("Credenciais invalidas")).toBeTruthy()
    })
  })
})
