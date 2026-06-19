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
  register: jest.fn(),
  login: jest.fn(),
}))

import RegisterScreen from "../../app/(auth)/register"
import * as authService from "../../services/auth.service"

beforeEach(() => {
  jest.clearAllMocks()
})

describe("RegisterScreen — validacao do formulario", () => {
  it("exibe erro quando nome completo tem apenas um nome", async () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />)

    fireEvent.changeText(getByPlaceholderText("Nome"), "Joao")
    fireEvent.changeText(getByPlaceholderText("seu@email.com"), "joao@teste.com")
    fireEvent.changeText(getByPlaceholderText("Senha"), "senha123")
    fireEvent.changeText(getByPlaceholderText("Confirmar senha"), "senha123")

    await act(async () => {
      fireEvent.press(getByText("Cadastrar"))
    })

    await waitFor(() => {
      expect(getByText("Informe nome e sobrenome")).toBeTruthy()
    })
  })

  it("exibe erro quando email e invalido", async () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />)

    fireEvent.changeText(getByPlaceholderText("Nome"), "Joao Silva")
    fireEvent.changeText(getByPlaceholderText("seu@email.com"), "nao-e-email")
    fireEvent.changeText(getByPlaceholderText("Senha"), "senha123")
    fireEvent.changeText(getByPlaceholderText("Confirmar senha"), "senha123")

    await act(async () => {
      fireEvent.press(getByText("Cadastrar"))
    })

    await waitFor(() => {
      expect(getByText("E-mail inválido")).toBeTruthy()
    })
  })

  it("exibe erro quando senha tem menos de 8 caracteres", async () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />)

    fireEvent.changeText(getByPlaceholderText("Nome"), "Joao Silva")
    fireEvent.changeText(getByPlaceholderText("seu@email.com"), "joao@teste.com")
    fireEvent.changeText(getByPlaceholderText("Senha"), "123456")
    fireEvent.changeText(getByPlaceholderText("Confirmar senha"), "123456")

    await act(async () => {
      fireEvent.press(getByText("Cadastrar"))
    })

    await waitFor(() => {
      expect(getByText("A senha deve ter no mínimo 8 caracteres")).toBeTruthy()
    })
  })

  it("exibe erro quando confirmPassword nao bate com password", async () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />)

    fireEvent.changeText(getByPlaceholderText("Nome"), "Joao Silva")
    fireEvent.changeText(getByPlaceholderText("seu@email.com"), "joao@teste.com")
    fireEvent.changeText(getByPlaceholderText("Senha"), "senha123")
    fireEvent.changeText(getByPlaceholderText("Confirmar senha"), "diferente")

    await act(async () => {
      fireEvent.press(getByText("Cadastrar"))
    })

    await waitFor(() => {
      expect(getByText("As senhas não coincidem")).toBeTruthy()
    })
  })
})

describe("RegisterScreen — erro da API", () => {
  it("exibe erro quando email ja esta cadastrado", async () => {
    ;(authService.register as jest.Mock).mockRejectedValueOnce(
      new Error("Email já cadastrado")
    )

    const { getByPlaceholderText, getByText } = render(<RegisterScreen />)

    fireEvent.changeText(getByPlaceholderText("Nome"), "Joao Silva")
    fireEvent.changeText(getByPlaceholderText("seu@email.com"), "joao@teste.com")
    fireEvent.changeText(getByPlaceholderText("Senha"), "senha123")
    fireEvent.changeText(getByPlaceholderText("Confirmar senha"), "senha123")

    await act(async () => {
      fireEvent.press(getByText("Cadastrar"))
    })

    await waitFor(() => {
      expect(getByText("Email já cadastrado")).toBeTruthy()
    })
  })
})
