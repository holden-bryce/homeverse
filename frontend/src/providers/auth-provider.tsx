'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { useCurrentUser, useCurrentCompany } from '@/lib/supabase/hooks'
import { supabase } from '@/lib/supabase'
import type { User, Company } from '@/types'

interface AuthContextType {
  user: User | null
  company: Company | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const { user, company, isAuthenticated, setUser, setCompany, setLoading, logout: storeLogout } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)
  
  // React Query hooks for fetching user/company data
  const userQuery = useCurrentUser()
  const companyQuery = useCurrentCompany()

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // Session exists, try to fetch user data
          if (!user && !userQuery.isLoading) {
            await userQuery.refetch()
          }
          if (!company && !companyQuery.isLoading) {
            await companyQuery.refetch()
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        // Clear invalid session
        await supabase.auth.signOut()
        storeLogout()
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }

    if (!isInitialized) {
      initializeAuth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update store when queries succeed
  useEffect(() => {
    if (userQuery.data && userQuery.data !== user) {
      setUser(userQuery.data)
    }
  }, [userQuery.data, user, setUser])

  useEffect(() => {
    if (companyQuery.data && companyQuery.data !== company) {
      setCompany(companyQuery.data)
    }
  }, [companyQuery.data, company, setCompany])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      // Fetch user profile and company data after login
      await userQuery.refetch()
      await companyQuery.refetch()
      
      // Redirect to dashboard or return URL
      const searchParams = new URLSearchParams(window.location.search)
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      router.push(redirectTo)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      storeLogout()
      router.push('/auth/login')
    }
  }

  const refreshAuth = async () => {
    try {
      setLoading(true)
      await userQuery.refetch()
      await companyQuery.refetch()
    } finally {
      setLoading(false)
    }
  }

  const contextValue: AuthContextType = {
    user,
    company,
    isLoading: !isInitialized || userQuery.isLoading || companyQuery.isLoading,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}