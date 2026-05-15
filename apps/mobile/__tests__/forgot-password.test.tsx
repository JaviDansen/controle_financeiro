import React from 'react'
import { fireEvent, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from './helpers/render'
import ForgotPasswordScreen from '@/app/(auth)/forgot-password'

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
  forgotPassword: jest.fn(),
}))

import * as authService from '@/services/auth.service'
const mockForgotPassword = authService.forgotPassword as jest.MockedFunction<typeof authService.forgotPassword>

describe('Tela de Recuperação de Senha', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza campo de e-mail', () => {
    const { getByPlaceholderText } = renderWithProviders(<ForgotPasswordScreen />)
    expect(getByPlaceholderText(/e-mail/i)).toBeTruthy()
  })

  it('exibe erro quando e-mail está ausente', async () => {
    const { getByText, getByRole } = renderWithProviders(<ForgotPasswordScreen />)
    fireEvent.press(getByRole('button', { name: /enviar/i }))
    await waitFor(() => {
      expect(getByText(/e-mail.*obrigat[oó]rio/i)).toBeTruthy()
    })
  })

  it('exibe erro Zod quando e-mail tem formato inválido', async () => {
    const { getByPlaceholderText, getByText, getByRole } = renderWithProviders(<ForgotPasswordScreen />)
    fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'nao-é-email')
    fireEvent.press(getByRole('button', { name: /enviar/i }))
    await waitFor(() => {
      expect(getByText(/e-mail.*inv[aá]lido/i)).toBeTruthy()
    })
  })

  it('exibe mensagem de confirmação após submit bem-sucedido', async () => {
    mockForgotPassword.mockResolvedValueOnce({ message: 'E-mail enviado' })
    const { getByPlaceholderText, getByRole, getByText } = renderWithProviders(<ForgotPasswordScreen />)
    fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'joao@teste.com')
    fireEvent.press(getByRole('button', { name: /enviar/i }))
    await waitFor(() => {
      expect(getByText(/e-mail enviado|verifique.*caixa/i)).toBeTruthy()
    })
  })

  it('mostra erro da API se a requisição falhar', async () => {
    mockForgotPassword.mockRejectedValueOnce(new Error('Erro ao enviar e-mail'))
    const { getByPlaceholderText, getByRole, getByText } = renderWithProviders(<ForgotPasswordScreen />)
    fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'joao@teste.com')
    fireEvent.press(getByRole('button', { name: /enviar/i }))
    await waitFor(() => {
      expect(getByText(/erro ao enviar/i)).toBeTruthy()
    })
  })
})
