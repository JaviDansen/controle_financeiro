import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

type User = {
  id: string
  name: string
  email: string
}

type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User, token: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setUser: async (user, token) => {
    await SecureStore.setItemAsync('token', token)
    set({ user, token, isAuthenticated: true })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
