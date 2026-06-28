import React from 'react'
import { fireEvent, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '../helpers/render'
import ForgotPasswordScreen from '@/app/(auth)/forgot-password'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: mockPush }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('@/services/auth.service', () => ({
  forgotPassword: jest.fn().mockResolvedValue(undefined),
}))

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
    fireEvent.press(getByRole('button', { name: /enviar c[oó]digo/i }))
    await waitFor(() => {
      expect(getByText(/e-mail.*obrigat[oó]rio/i)).toBeTruthy()
    })
  })

  it('exibe erro Zod quando e-mail tem formato inválido', async () => {
    const { getByPlaceholderText, getByText, getByRole } = renderWithProviders(<ForgotPasswordScreen />)
    fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'nao-é-email')
    fireEvent.press(getByRole('button', { name: /enviar c[oó]digo/i }))
    await waitFor(() => {
      expect(getByText(/e-mail.*inv[aá]lido/i)).toBeTruthy()
    })
  })

  it('navega para a tela de verificação de código após submit bem-sucedido', async () => {
    const { getByPlaceholderText, getByRole } = renderWithProviders(<ForgotPasswordScreen />)
    fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'joao@teste.com')
    fireEvent.press(getByRole('button', { name: /enviar c[oó]digo/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(auth)/verify-code',
        params: { email: 'joao@teste.com' },
      })
    })
  })
})
