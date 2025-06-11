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

// Client-side focused auth provider that works reliably with Supabase
export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Simple profile loader that works client-side
  const loadProfile = async (userId: string): Promise<any> => {
    try {
      console.log('Loading profile for:', userId)
      
      // Direct query with no complex joins
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profileError) {
        console.log('Profile not found, creating...')
        
        // Create profile with default company
        const newProfile = {
          id: userId,
          company_id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
          role: 'buyer',
          full_name: 'User'
        }
        
        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single()
        
        if (createError) {
          console.error('Failed to create profile:', createError)
          return null
        }
        
        return created
      }
      
      // Load company separately to avoid join issues
      if (profileData && profileData.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profileData.company_id)
          .single()
        
        return {
          ...profileData,
          companies: company
        }
      }
      
      return profileData
    } catch (error) {
      console.error('Profile load error:', error)
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get session
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (currentSession) {
          console.log('Session found:', currentSession.user.email)
          setSession(currentSession)
          setUser(currentSession.user)
          
          // Load profile
          const profileData = await loadProfile(currentSession.user.id)
          if (profileData && mounted) {
            setProfile(profileData)
          }
        }
        
        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth init error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        if (!mounted) return
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const profileData = await loadProfile(session.user.id)
          if (mounted) {
            setProfile(profileData)
          }
        } else {
          setProfile(null)
        }
        
        if (mounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string, redirectUrl?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (data.user && data.session) {
      // Wait for profile to load
      const profile = await loadProfile(data.user.id)
      
      // Determine redirect based on role
      const roleRedirects: Record<string, string> = {
        developer: '/dashboard',
        lender: '/dashboard/lenders',
        buyer: '/dashboard/buyers',
        applicant: '/dashboard',
        admin: '/dashboard'
      }
      
      const targetUrl = redirectUrl || roleRedirects[profile?.role || 'buyer'] || '/dashboard'
      router.push(targetUrl)
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

    // Create profile
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        company_id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8',
        ...metadata,
      })
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Signout error:', error)
    
    setUser(null)
    setSession(null)
    setProfile(null)
    
    router.push('/auth/login')
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await loadProfile(user.id)
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