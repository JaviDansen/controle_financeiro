import React from 'react'
import { fireEvent, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from './helpers/render'
import LoginScreen from '@/app/(auth)/login'

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('@/services/auth.service', () => ({
  login: jest.fn(),
}))

import * as authService from '@/services/auth.service'
const mockLogin = authService.login as jest.MockedFunction<typeof authService.login>

describe('Tela de Login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza campo de e-mail', () => {
    const { getByPlaceholderText } = renderWithProviders(<LoginScreen />)
    expect(getByPlaceholderText(/e-mail/i)).toBeTruthy()
  })

  it('renderiza campo de senha', () => {
    const { getByPlaceholderText } = renderWithProviders(<LoginScreen />)
    expect(getByPlaceholderText(/senha/i)).toBeTruthy()
  })

  it('exibe erro Zod quando e-mail tem formato inválido', async () => {
    const { getByPlaceholderText, getByText, getByRole } = renderWithProviders(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'nao-é-email')
    fireEvent.changeText(getByPlaceholderText(/senha/i), 'senha123')
    fireEvent.press(getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(getByText(/e-mail.*inv[aá]lido/i)).toBeTruthy()
    })
  })

  it('exibe erro Zod quando senha está vazia', async () => {
    const { getByPlaceholderText, getByText, getByRole } = renderWithProviders(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'joao@teste.com')
    fireEvent.press(getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(getByText(/senha.*obrigat[oó]ria/i)).toBeTruthy()
    })
  })

  it('chama serviço de login ao submeter formulário válido', async () => {
    mockLogin.mockResolvedValueOnce({ token: 'eyJ.abc.def', user: { id: '1', name: 'João', email: 'joao@teste.com' } })
    const { getByPlaceholderText, getByRole } = renderWithProviders(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'joao@teste.com')
    fireEvent.changeText(getByPlaceholderText(/senha/i), 'senha123')
    fireEvent.press(getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'joao@teste.com', password: 'senha123' })
    })
  })

  it('redireciona para Home após login bem-sucedido', async () => {
    const mockReplace = jest.fn()
    jest.mocked(require('expo-router').useRouter).mockReturnValue({ replace: mockReplace, push: jest.fn() })
    mockLogin.mockResolvedValueOnce({ token: 'eyJ.abc.def', user: { id: '1', name: 'João', email: 'joao@teste.com' } })
    const { getByPlaceholderText, getByRole } = renderWithProviders(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'joao@teste.com')
    fireEvent.changeText(getByPlaceholderText(/senha/i), 'senha123')
    fireEvent.press(getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)')
    })
  })

  it('exibe mensagem de erro da API em caso de falha', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Credenciais inválidas'))
    const { getByPlaceholderText, getByRole, getByText } = renderWithProviders(<LoginScreen />)
    fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'joao@teste.com')
    fireEvent.changeText(getByPlaceholderText(/senha/i), 'senha123')
    fireEvent.press(getByRole('button', { name: /entrar/i }))
    await waitFor(() => {
      expect(getByText(/credenciais inv[aá]lidas/i)).toBeTruthy()
    })
  })
})
