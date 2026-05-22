import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { validateStoredToken } from '../services/auth.service';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hasHydrated: false,

  setUser: (user) => {
    set({ user });
  },

  setToken: async (token) => {
    if (token) {
      await SecureStore.setItemAsync('token', token);
    } else {
      await SecureStore.deleteItemAsync('token');
    }

    set({ token, isAuthenticated: !!token });
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync('token');

    if (!token) {
      set({
        token: null,
        isAuthenticated: false,
        hasHydrated: true,
      });
      return;
    }

    const isValidToken = await validateStoredToken(token);

    if (!isValidToken) {
      await SecureStore.deleteItemAsync('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        hasHydrated: true,
      });
      return;
    }

    set({
      token,
      isAuthenticated: true,
      hasHydrated: true,
    });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    set({ user: null, token: null, isAuthenticated: false, hasHydrated: true });
  },
}));
