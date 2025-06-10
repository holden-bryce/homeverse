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

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        try {
          await loadProfile(session.user.id)
        } catch (error) {
          console.log('Profile load failed, using metadata:', error)
          // Set profile from metadata if database fails
          setProfile({
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role || 'buyer',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            company_id: session.user.user_metadata?.company_id
          })
        }
      }
      
      setLoading(false)
    }).catch((error) => {
      console.error('Error getting session:', error)
      setLoading(false)
    })

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const profile = await getProfile(userId)
      setProfile(profile)
      return profile
    } catch (error) {
      console.error('Error loading profile:', error)
      // Try to get user info from auth.users table as fallback
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        const fallbackProfile = {
          id: userData.user.id,
          role: userData.user.user_metadata?.role || 'buyer',
          full_name: userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0],
          company_id: userData.user.user_metadata?.company_id
        }
        setProfile(fallbackProfile)
        return fallbackProfile
      }
      return null
    }
  }

  const signIn = async (email: string, password: string, redirectUrl?: string) => {
    console.log('SignIn called with:', email)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Supabase auth response:', { data, error })

      if (error) {
        console.error('Supabase auth error:', error)
        throw error
      }

      if (data.user && data.session) {
        console.log('Login successful, user:', data.user.email)
        
        // The auth state change listener will handle setting user/session state
        // Just do the redirect here
        const role = data.user.user_metadata?.role || 'buyer'
        console.log('User role:', role)
        
        // Redirect based on role
        const roleRoutes: Record<string, string> = {
          developer: '/dashboard/projects',
          lender: '/dashboard/lenders',
          buyer: '/dashboard/buyers',
          applicant: '/dashboard/applicants',
          admin: '/dashboard',
        }
        
        const defaultPath = roleRoutes[role] || '/dashboard'
        const finalRedirect = redirectUrl || defaultPath
        console.log(`Redirecting to: ${finalRedirect}`)
        
        // Use router.push instead of window.location for SPA navigation
        router.push(finalRedirect)
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
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id)
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