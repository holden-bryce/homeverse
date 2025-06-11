'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'
import { supabase, getProfile } from '@/lib/supabase'

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

  // Debug state changes
  useEffect(() => {
    console.log('🔄 Auth State Updated:', {
      user: user?.email,
      session: !!session,
      profile: profile,
      loading
    })
  }, [user, session, profile, loading])

  useEffect(() => {
    let mounted = true
    
    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth...')
        
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          if (mounted) {
            setLoading(false)
          }
          return
        }
        
        console.log('📍 Current session:', currentSession?.user?.email)
        
        if (currentSession?.user && mounted) {
          setSession(currentSession)
          setUser(currentSession.user)
          
          // Load profile with better error handling
          try {
            const profileData = await loadProfileSafely(currentSession.user.id)
            if (mounted && profileData) {
              setProfile(profileData)
            }
          } catch (profileError) {
            console.error('Profile load error in init:', profileError)
            // Set a minimal profile from session
            if (mounted) {
              setProfile({
                id: currentSession.user.id,
                email: currentSession.user.email,
                role: determineRoleFromEmail(currentSession.user.email),
                company_id: 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8'
              })
            }
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
    
    initAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔔 Auth state change:', event, newSession?.user?.email)
        
        if (!mounted) return
        
        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession)
          setUser(newSession.user)
          
          // Load profile
          try {
            const profileData = await loadProfileSafely(newSession.user.id)
            if (mounted && profileData) {
              setProfile(profileData)
            }
          } catch (error) {
            console.error('Profile load error on auth change:', error)
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
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

  const determineRoleFromEmail = (email?: string | null): string => {
    if (!email) return 'buyer'
    
    const emailRoleMap: Record<string, string> = {
      'admin@test.com': 'admin',
      'developer@test.com': 'developer',
      'lender@test.com': 'lender',
      'buyer@test.com': 'buyer',
      'applicant@test.com': 'applicant'
    }
    
    return emailRoleMap[email] || 'buyer'
  }

  const loadProfileSafely = async (userId: string): Promise<any> => {
    console.log('🔍 Loading profile safely for:', userId)
    
    try {
      // Try to get profile from database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()  // Use maybeSingle to avoid error if not found
      
      if (data) {
        console.log('✅ Profile loaded from DB:', data)
        
        // Try to load company
        if (data.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('id', data.company_id)
            .maybeSingle()
          
          if (company) {
            data.companies = company
          }
        }
        
        return data
      }
      
      if (error && error.code !== 'PGRST116') {
        console.error('Profile query error:', error)
      }
      
      // If no profile found, get user details and create minimal profile
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const minimalProfile = {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || determineRoleFromEmail(user.email),
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          company_id: user.user_metadata?.company_id || 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8'
        }
        
        console.log('📋 Using minimal profile:', minimalProfile)
        return minimalProfile
      }
      
      return null
    } catch (error) {
      console.error('Profile load exception:', error)
      return null
    }
  }

  const signIn = async (email: string, password: string, redirectUrl?: string) => {
    console.log('🔐 SignIn called with:', email)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Supabase auth error:', error)
        throw error
      }

      console.log('✅ Sign in successful:', data.user?.email)
      
      // The auth state change listener will handle setting the user/session
      // Just handle the redirect
      if (data.user) {
        const userRole = determineRoleFromEmail(data.user.email)
        
        const roleRedirects: Record<string, string> = {
          developer: '/dashboard',
          lender: '/dashboard/lenders',
          buyer: '/dashboard/buyers',
          applicant: '/dashboard',
          admin: '/dashboard'
        }
        
        const targetUrl = redirectUrl || roleRedirects[userRole] || '/dashboard'
        
        console.log('🚀 Redirecting to:', targetUrl)
        
        // Use a small delay to ensure state updates
        setTimeout(() => {
          window.location.href = targetUrl
        }, 100)
      }
    } catch (error) {
      console.error('SignIn error:', error)
      throw error
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

    // Create profile after signup
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          ...metadata,
        })

      if (profileError) throw profileError
    }
  }

  const signOut = async () => {
    try {
      console.log('🚪 Starting signOut...')
      
      // Clear state first
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Redirect
      window.location.replace('/auth/login')
    } catch (error) {
      console.error('SignOut error:', error)
      window.location.replace('/auth/login')
    }
  }

  const refreshProfile = async () => {
    console.log('🔄 Refresh profile called')
    if (user) {
      const profileData = await loadProfileSafely(user.id)
      if (profileData) {
        setProfile(profileData)
      }
      return profileData
    }
    return null
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