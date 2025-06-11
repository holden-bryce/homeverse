'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: any | null
  loading: boolean
  signIn: (email: string, password: string, redirectUrl?: string) => Promise<void>
  signUp: (email: string, password: string, metadata: any) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
})

export const useAuth = () => useContext(AuthContext)

// Email to role mapping
const EMAIL_ROLE_MAP: Record<string, string> = {
  'admin@test.com': 'admin',
  'developer@test.com': 'developer',
  'lender@test.com': 'lender',
  'buyer@test.com': 'buyer',
  'applicant@test.com': 'applicant'
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
        setUser(session.user)
        
        // Create profile from session data
        const userProfile = {
          id: session.user.id,
          email: session.user.email,
          role: EMAIL_ROLE_MAP[session.user.email || ''] || 'buyer',
          full_name: session.user.email?.split('@')[0] || 'User',
          company_id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
          companies: {
            id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
            name: 'Default Company',
            plan: 'trial',
            seats: 100
          }
        }
        setProfile(userProfile)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session)
        setUser(session.user)
        
        // Create profile from session data
        const userProfile = {
          id: session.user.id,
          email: session.user.email,
          role: EMAIL_ROLE_MAP[session.user.email || ''] || 'buyer',
          full_name: session.user.email?.split('@')[0] || 'User',
          company_id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
          companies: {
            id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
            name: 'Default Company',
            plan: 'trial',
            seats: 100
          }
        }
        setProfile(userProfile)
      } else {
        setSession(null)
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string, redirectUrl?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      // Determine redirect based on email
      const role = EMAIL_ROLE_MAP[email] || 'buyer'
      const roleRedirects: Record<string, string> = {
        developer: '/dashboard',
        lender: '/dashboard/lenders',
        buyer: '/dashboard/buyers',
        applicant: '/dashboard',
        admin: '/dashboard'
      }
      
      const targetUrl = redirectUrl || roleRedirects[role] || '/dashboard'
      
      // Force a hard redirect to ensure state is fresh
      window.location.href = targetUrl
    }
  }

  const signUp = async (email: string, password: string, metadata: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const refreshProfile = async () => {
    // In this simple version, profile is derived from user
    if (user) {
      const userProfile = {
        id: user.id,
        email: user.email,
        role: EMAIL_ROLE_MAP[user.email || ''] || 'buyer',
        full_name: user.email?.split('@')[0] || 'User',
        company_id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
        companies: {
          id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
          name: 'Default Company',
          plan: 'trial',
          seats: 100
        }
      }
      setProfile(userProfile)
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}