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
  setUser: (user: User | null) => Promise<void>;
  setToken: (token: string | null) => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hasHydrated: false,

  setUser: async (user) => {
    set({ user });
    if (user) {
      await SecureStore.setItemAsync('user', JSON.stringify(user));
    } else {
      await SecureStore.deleteItemAsync('user');
    }
  },

  setToken: async (token) => {
    set({ token, isAuthenticated: !!token });

    if (token) {
      await SecureStore.setItemAsync('token', token);
    } else {
      await SecureStore.deleteItemAsync('token');
    }
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync('token');

    if (!token) {
      set({ token: null, isAuthenticated: false, hasHydrated: true });
      return;
    }

    const isValidToken = await validateStoredToken(token);

    if (!isValidToken) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      set({ user: null, token: null, isAuthenticated: false, hasHydrated: true });
      return;
    }

    const userRaw = await SecureStore.getItemAsync('user');
    const user: User | null = userRaw ? JSON.parse(userRaw) : null;

    set({ token, user, isAuthenticated: true, hasHydrated: true });
  },

  logout: async () => {
    set({ user: null, token: null, isAuthenticated: false, hasHydrated: true });
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  },
}));
