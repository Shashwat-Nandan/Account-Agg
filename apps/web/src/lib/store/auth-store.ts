'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  phone: string;
  email: string | null;
  kycStatus: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      setAuth: (user, token) => set({ user, token, isLoading: false }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    { name: 'auth-store' },
  ),
);
