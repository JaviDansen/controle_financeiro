import React from 'react'
import { fireEvent, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from './helpers/render'
import RegisterScreen from '@/app/(auth)/register'

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
  register: jest.fn(),
}))

import * as authService from '@/services/auth.service'
const mockRegister = authService.register as jest.MockedFunction<typeof authService.register>

describe('Tela de Registro', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('renderização', () => {
    it('renderiza campo de nome', () => {
      const { getByPlaceholderText } = renderWithProviders(<RegisterScreen />)
      expect(getByPlaceholderText(/nome/i)).toBeTruthy()
    })

    it('renderiza campo de e-mail', () => {
      const { getByPlaceholderText } = renderWithProviders(<RegisterScreen />)
      expect(getByPlaceholderText(/e-mail/i)).toBeTruthy()
    })

    it('renderiza campo de senha', () => {
      const { getByPlaceholderText } = renderWithProviders(<RegisterScreen />)
      expect(getByPlaceholderText(/^senha$/i)).toBeTruthy()
    })

    it('renderiza campo de confirmação de senha', () => {
      const { getByPlaceholderText } = renderWithProviders(<RegisterScreen />)
      expect(getByPlaceholderText(/confirmar senha/i)).toBeTruthy()
    })

    it('renderiza botão de cadastro', () => {
      const { getByRole } = renderWithProviders(<RegisterScreen />)
      expect(getByRole('button', { name: /cadastrar/i })).toBeTruthy()
    })
  })

  describe('validação Zod', () => {
    it('exibe erro quando nome está ausente', async () => {
      const { getByPlaceholderText, getByText, getByRole } = renderWithProviders(<RegisterScreen />)
      fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'joao@teste.com')
      fireEvent.changeText(getByPlaceholderText(/^senha$/i), 'senha123')
      fireEvent.changeText(getByPlaceholderText(/confirmar senha/i), 'senha123')
      fireEvent.press(getByRole('button', { name: /cadastrar/i }))
      await waitFor(() => {
        expect(getByText(/nome.*obrigat[oó]rio/i)).toBeTruthy()
      })
    })

    it('exibe erro quando e-mail está ausente', async () => {
      const { getByPlaceholderText, getByText, getByRole } = renderWithProviders(<RegisterScreen />)
      fireEvent.changeText(getByPlaceholderText(/nome/i), 'João')
      fireEvent.changeText(getByPlaceholderText(/^senha$/i), 'senha123')
      fireEvent.changeText(getByPlaceholderText(/confirmar senha/i), 'senha123')
      fireEvent.press(getByRole('button', { name: /cadastrar/i }))
      await waitFor(() => {
        expect(getByText(/e-mail.*obrigat[oó]rio/i)).toBeTruthy()
      })
    })

    it('exibe erro quando e-mail tem formato inválido', async () => {
      const { getByPlaceholderText, getByText, getByRole } = renderWithProviders(<RegisterScreen />)
      fireEvent.changeText(getByPlaceholderText(/nome/i), 'João')
      fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'nao-é-email')
      fireEvent.changeText(getByPlaceholderText(/^senha$/i), 'senha123')
      fireEvent.changeText(getByPlaceholderText(/confirmar senha/i), 'senha123')
      fireEvent.press(getByRole('button', { name: /cadastrar/i }))
      await waitFor(() => {
        expect(getByText(/e-mail.*inv[aá]lido/i)).toBeTruthy()
      })
    })

    it('exibe erro quando senha tem menos de 6 caracteres', async () => {
      const { getByPlaceholderText, getByText, getByRole } = renderWithProviders(<RegisterScreen />)
      fireEvent.changeText(getByPlaceholderText(/nome/i), 'João')
      fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'joao@teste.com')
      fireEvent.changeText(getByPlaceholderText(/^senha$/i), '123')
      fireEvent.changeText(getByPlaceholderText(/confirmar senha/i), '123')
      fireEvent.press(getByRole('button', { name: /cadastrar/i }))
      await waitFor(() => {
        expect(getByText(/senha.*m[ií]nimo/i)).toBeTruthy()
      })
    })

    it('exibe erro quando confirmação de senha não bate com a senha', async () => {
    const { getByPlaceholderText, getByText, getByRole } = renderWithProviders(<RegisterScreen />)
    fireEvent.changeText(getByPlaceholderText(/^senha$/i), 'senha123')
    fireEvent.changeText(getByPlaceholderText(/confirmar senha/i), 'outra-senha')
    fireEvent.press(getByRole('button', { name: /cadastrar/i }))
    await waitFor(() => {
      expect(getByText(/senhas.*n[aã]o.*coincidem/i)).toBeTruthy()
    })
  })

  describe('chamada ao serviço', () => {
    it('chama authService.register com os dados corretos', async () => {
      mockRegister.mockResolvedValueOnce({ id: '1', name: 'João', email: 'joao@teste.com', createdAt: new Date().toISOString() })
      const { getByPlaceholderText, getByRole } = renderWithProviders(<RegisterScreen />)
      fireEvent.changeText(getByPlaceholderText(/nome/i), 'João')
      fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'joao@teste.com')
      fireEvent.changeText(getByPlaceholderText(/^senha$/i), 'senha123')
      fireEvent.changeText(getByPlaceholderText(/confirmar senha/i), 'senha123')
      fireEvent.press(getByRole('button', { name: /cadastrar/i }))
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'João',
          email: 'joao@teste.com',
          password: 'senha123',
        })
      })
    })
  })

  it('exibe erro quando e-mail já está cadastrado (resposta da API)', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Email já cadastrado'))
    const { getByPlaceholderText, getByRole, getByText } = renderWithProviders(<RegisterScreen />)
    fireEvent.changeText(getByPlaceholderText(/nome/i), 'João')
    fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'joao@teste.com')
    fireEvent.changeText(getByPlaceholderText(/^senha$/i), 'senha123')
    fireEvent.changeText(getByPlaceholderText(/confirmar senha/i), 'senha123')
    fireEvent.press(getByRole('button', { name: /cadastrar/i }))
    await waitFor(() => {
      expect(getByText(/email j[aá] cadastrado/i)).toBeTruthy()
    })
  })

  it('redireciona após registro bem-sucedido', async () => {
    const mockReplace = jest.fn()
    jest.mocked(require('expo-router').useRouter).mockReturnValue({ replace: mockReplace, push: jest.fn() })
    mockRegister.mockResolvedValueOnce({ id: '1', name: 'João', email: 'joao@teste.com', createdAt: new Date().toISOString() })
    const { getByPlaceholderText, getByRole } = renderWithProviders(<RegisterScreen />)
    fireEvent.changeText(getByPlaceholderText(/nome/i), 'João')
    fireEvent.changeText(getByPlaceholderText(/e-mail/i), 'joao@teste.com')
    fireEvent.changeText(getByPlaceholderText(/^senha$/i), 'senha123')
    fireEvent.changeText(getByPlaceholderText(/confirmar senha/i), 'senha123')
    fireEvent.press(getByRole('button', { name: /cadastrar/i }))
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login')
    })
  })
})
