import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  userId: string;
  role: 'Super Admin' | 'HR Manager' | 'Employee';
  forcePasswordChange?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      updateUser: (updates) => set((state) => ({ 
        user: state.user ? { ...state.user, ...updates } : null 
      })),
    }),
    {
      name: 'ems-auth', // key in local storage
    }
  )
);
