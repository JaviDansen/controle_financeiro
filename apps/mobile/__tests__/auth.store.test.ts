import * as SecureStore from 'expo-secure-store'
import { useAuthStore } from '@/store/auth.store'

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>

describe('auth.store', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  })

  describe('estado inicial', () => {
    it('user é null', () => {
      const { user } = useAuthStore.getState()
      expect(user).toBeNull()
    })

    it('token é null', () => {
      const { token } = useAuthStore.getState()
      expect(token).toBeNull()
    })

    it('isAuthenticated é false', () => {
      const { isAuthenticated } = useAuthStore.getState()
      expect(isAuthenticated).toBe(false)
    })
  })

  describe('setUser', () => {
    const fakeUser = { id: 'abc-123', name: 'João', email: 'joao@teste.com' }
    const fakeToken = 'eyJ.abc.def'

    it('atualiza user no estado', async () => {
      await useAuthStore.getState().setUser(fakeUser, fakeToken)
      expect(useAuthStore.getState().user).toEqual(fakeUser)
    })

    it('atualiza token no estado', async () => {
      await useAuthStore.getState().setUser(fakeUser, fakeToken)
      expect(useAuthStore.getState().token).toBe(fakeToken)
    })

    it('marca isAuthenticated como true', async () => {
      await useAuthStore.getState().setUser(fakeUser, fakeToken)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('persiste token no SecureStore', async () => {
      await useAuthStore.getState().setUser(fakeUser, fakeToken)
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('token', fakeToken)
    })
  })

  describe('logout', () => {
    const fakeUser = { id: 'abc-123', name: 'João', email: 'joao@teste.com' }

    beforeEach(async () => {
      await useAuthStore.getState().setUser(fakeUser, 'eyJ.abc.def')
    })

    it('limpa user do estado', async () => {
      await useAuthStore.getState().logout()
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('limpa token do estado', async () => {
      await useAuthStore.getState().logout()
      expect(useAuthStore.getState().token).toBeNull()
    })

    it('marca isAuthenticated como false', async () => {
      await useAuthStore.getState().logout()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('remove token do SecureStore', async () => {
      await useAuthStore.getState().logout()
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('token')
    })
  })
})
