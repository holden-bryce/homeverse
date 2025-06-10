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

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check active sessions
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial session check:', session?.user?.email)
        
        if (session) {
          setSession(session)
          setUser(session.user)
          
          // Set profile from user metadata (no database query needed)
          setProfile({
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role || 'buyer',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            company_id: session.user.user_metadata?.company_id
          })
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (session) {
        setSession(session)
        setUser(session.user)
        setProfile({
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role || 'buyer',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          company_id: session.user.user_metadata?.company_id
        })
      } else {
        setSession(null)
        setUser(null)
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string, redirectUrl?: string) => {
    console.log('Attempting sign in for:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error)
      throw error
    }

    console.log('Sign in successful:', data.user?.email)
    
    // The onAuthStateChange listener will handle updating state
    // Just wait a moment for it to trigger
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Then redirect
    const role = data.user?.user_metadata?.role || 'buyer'
    const roleRoutes: Record<string, string> = {
      developer: '/dashboard/projects',
      lender: '/dashboard/lenders',
      buyer: '/dashboard/buyers',
      applicant: '/dashboard/applicants',
      admin: '/dashboard',
    }
    
    const defaultPath = roleRoutes[role] || '/dashboard'
    const finalRedirect = redirectUrl || defaultPath
    
    console.log('Redirecting to:', finalRedirect)
    router.push(finalRedirect)
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
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    setUser(null)
    setSession(null)
    setProfile(null)
    router.push('/')
  }

  const refreshProfile = async () => {
    // For now, just refresh from user metadata
    if (user) {
      setProfile({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'buyer',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        company_id: user.user_metadata?.company_id
      })
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}