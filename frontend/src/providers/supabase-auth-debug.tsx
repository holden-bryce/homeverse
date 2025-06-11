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

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    console.log('🔄 Auth Provider: Initializing...')
    
    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Auth Provider: Session error:', error)
          setLoading(false)
          return
        }
        
        if (currentSession) {
          console.log('✅ Auth Provider: Session found for:', currentSession.user.email)
          setSession(currentSession)
          setUser(currentSession.user)
          
          // Load profile with hardcoded company for now
          const profileData = {
            id: currentSession.user.id,
            email: currentSession.user.email,
            role: currentSession.user.email === 'admin@test.com' ? 'admin' :
                  currentSession.user.email === 'developer@test.com' ? 'developer' :
                  currentSession.user.email === 'lender@test.com' ? 'lender' :
                  currentSession.user.email === 'buyer@test.com' ? 'buyer' :
                  currentSession.user.email === 'applicant@test.com' ? 'applicant' : 'user',
            full_name: currentSession.user.email?.split('@')[0] || 'User',
            company_id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
            companies: {
              id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
              name: 'Default Company',
              key: 'default-company',
              plan: 'trial',
              seats: 100
            }
          }
          
          console.log('📋 Auth Provider: Setting profile:', profileData)
          setProfile(profileData)
        } else {
          console.log('⚠️ Auth Provider: No session found')
        }
      } catch (error) {
        console.error('❌ Auth Provider: Init error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth Provider: Auth state changed:', event)
      
      if (session) {
        setSession(session)
        setUser(session.user)
        
        // Set profile based on email
        const profileData = {
          id: session.user.id,
          email: session.user.email,
          role: session.user.email === 'admin@test.com' ? 'admin' :
                session.user.email === 'developer@test.com' ? 'developer' :
                session.user.email === 'lender@test.com' ? 'lender' :
                session.user.email === 'buyer@test.com' ? 'buyer' :
                session.user.email === 'applicant@test.com' ? 'applicant' : 'user',
          full_name: session.user.email?.split('@')[0] || 'User',
          company_id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
          companies: {
            id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
            name: 'Default Company',
            key: 'default-company',
            plan: 'trial',
            seats: 100
          }
        }
        
        setProfile(profileData)
      } else {
        setUser(null)
        setSession(null)
        setProfile(null)
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string, redirectUrl?: string) => {
    console.log('🔑 Auth Provider: SignIn called with:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Auth Provider: SignIn error:', error)
      throw error
    }

    if (data.user && data.session) {
      console.log('✅ Auth Provider: SignIn successful')
      
      // Redirect based on role
      const roleRedirects: Record<string, string> = {
        developer: '/dashboard/projects',
        lender: '/dashboard/lenders',
        buyer: '/dashboard/buyers',
        applicant: '/dashboard/applicants',
        admin: '/dashboard'
      }
      
      const role = email === 'admin@test.com' ? 'admin' :
                   email === 'developer@test.com' ? 'developer' :
                   email === 'lender@test.com' ? 'lender' :
                   email === 'buyer@test.com' ? 'buyer' :
                   email === 'applicant@test.com' ? 'applicant' : 'user'
      
      const targetUrl = redirectUrl || roleRedirects[role] || '/dashboard'
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
    try {
      console.log('🚪 Auth Provider: SignOut called')
      
      setUser(null)
      setProfile(null)
      setSession(null)
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Auth Provider: SignOut error:', error)
      }
      
      window.location.replace('/auth/login')
    } catch (error) {
      console.error('❌ Auth Provider: SignOut exception:', error)
      window.location.replace('/auth/login')
    }
  }

  const refreshProfile = async () => {
    console.log('🔄 Auth Provider: RefreshProfile called')
    if (user) {
      // For now, just set the profile based on email
      const profileData = {
        id: user.id,
        email: user.email,
        role: user.email === 'admin@test.com' ? 'admin' :
              user.email === 'developer@test.com' ? 'developer' :
              user.email === 'lender@test.com' ? 'lender' :
              user.email === 'buyer@test.com' ? 'buyer' :
              user.email === 'applicant@test.com' ? 'applicant' : 'user',
        full_name: user.email?.split('@')[0] || 'User',
        company_id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
        companies: {
          id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
          name: 'Default Company',
          key: 'default-company',
          plan: 'trial',
          seats: 100
        }
      }
      
      setProfile(profileData)
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