import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Company } from '@/types'

interface AuthState {
  user: User | null
  company: Company | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setCompany: (company: Company | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      company: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set(() => ({
          user,
          isAuthenticated: !!user,
        })),

      setCompany: (company) =>
        set(() => ({
          company,
        })),

      setLoading: (loading) =>
        set(() => ({
          isLoading: loading,
        })),

      logout: () =>
        set(() => ({
          user: null,
          company: null,
          isAuthenticated: false,
          isLoading: false,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)