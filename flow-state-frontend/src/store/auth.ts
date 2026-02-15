import { create } from 'zustand';
import api from '../lib/api';
import { useAppStore } from './index';
import type { User } from '../types';



interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setTokens: (accessToken: string) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  login: (credentials: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // Start loading to check for refresh token cookie

  setTokens: (accessToken: string) => {
    set({ accessToken, isAuthenticated: true, isLoading: false });
  },

  //log out
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      useAppStore.getState().setPage('dashboard');
    }
  },

  //refresh token
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { access_token } = response.data;
      set({ accessToken: access_token, isAuthenticated: true });
    } catch (error) {
      set({ accessToken: null, isAuthenticated: false });
      throw error;
    }
  },

  //check authentication
  checkAuth: async () => {
    try {
      // Try to refresh the token on mount to see if we have a valid session cookie
      const response = await api.post('/auth/refresh');
      const { access_token } = response.data;
      set({
        accessToken: access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  //log in
  login: async credentials => {
    const response = await api.post('/auth/signin', credentials);
    const { access_token } = response.data;
    set({ accessToken: access_token, isAuthenticated: true });
    useAppStore.getState().setPage('dashboard');
  },

  //sign up
  signup: async data => {
    const response = await api.post('/auth/signup', data);
    const { access_token } = response.data;
    set({ accessToken: access_token, isAuthenticated: true });
    useAppStore.getState().setPage('dashboard');
  },
}));
