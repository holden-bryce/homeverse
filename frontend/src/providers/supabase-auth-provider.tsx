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
    let mounted = true
    
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      
      console.log('Initial session check:', session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        try {
          const loadedProfile = await loadProfile(session.user.id)
          console.log('Initial profile loaded:', loadedProfile)
        } catch (error) {
          console.log('Profile load failed, using metadata:', error)
          // Set profile from metadata if database fails
          if (mounted) {
            setProfile({
              id: session.user.id,
              email: session.user.email,
              role: session.user.user_metadata?.role || 'buyer',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              company_id: session.user.user_metadata?.company_id
            })
          }
        }
      }
      
      if (mounted) {
        setLoading(false)
      }
    }).catch((error) => {
      console.error('Error getting session:', error)
      if (mounted) {
        setLoading(false)
      }
    })
    
    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
      
      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (userId: string, forceReload: boolean = false) => {
    try {
      // First try to get the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', userId)
        .single()
      
      if (profileError || !profileData?.company_id) {
        console.log('Profile missing or incomplete, fixing...')
        
        // Get or create default company
        const { data: defaultCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('key', 'default-company')
          .single()
        
        let companyId = defaultCompany?.id
        
        if (!companyId) {
          // Create default company
          const { data: newCompany } = await supabase
            .from('companies')
            .insert({
              name: 'Default Company',
              key: 'default-company',
              plan: 'trial',
              seats: 100
            })
            .select()
            .single()
          
          companyId = newCompany?.id
        }
        
        // Create or update profile
        if (!profileData) {
          // Get user metadata
          const { data: { user } } = await supabase.auth.getUser()
          
          // Create profile
          await supabase
            .from('profiles')
            .insert({
              id: userId,
              company_id: companyId,
              role: user?.user_metadata?.role || 'buyer',
              full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
            })
        } else {
          // Update existing profile with company_id
          await supabase
            .from('profiles')
            .update({ company_id: companyId })
            .eq('id', userId)
        }
        
        // Reload profile
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*, companies(*)')
          .eq('id', userId)
          .single()
        
        console.log('Fixed profile:', updatedProfile)
        setProfile(updatedProfile)
        return updatedProfile
      }
      
      console.log('Loaded profile:', profileData)
      setProfile(profileData)
      return profileData
    } catch (error) {
      console.error('Error in loadProfile:', error)
      return null
    }
  }

  const signIn = async (email: string, password: string, redirectUrl?: string) => {
    console.log('SignIn called with:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('Supabase auth response:', { 
      user: data?.user?.email, 
      session: !!data?.session,
      error: error?.message 
    })

    if (error) {
      console.error('Supabase auth error:', error)
      throw error
    }

    // If login successful, the session will be stored in cookies
    // and the middleware will handle the redirect on the next navigation
    if (data.user && data.session) {
      console.log('Login successful, loading profile...')
      
      // Ensure profile is loaded and has company_id
      await loadProfile(data.user.id, true)
      
      // Get the user's role for redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      
      // Redirect based on role
      const roleRedirects: Record<string, string> = {
        developer: '/dashboard',
        lender: '/dashboard/lenders',
        buyer: '/dashboard/buyers',
        applicant: '/dashboard',
        admin: '/dashboard'
      }
      
      const targetUrl = redirectUrl || roleRedirects[profile?.role || 'buyer'] || '/dashboard'
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
      console.log('Starting signOut process...')
      
      // Clear local state first
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase signOut error:', error)
      }
      
      // Clear any persisted auth state
      if (typeof window !== 'undefined') {
        // Clear all localStorage items related to auth
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('auth') || key.includes('token'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=")
          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
        })
        
        // Clear sessionStorage too
        sessionStorage.clear()
      }
      
      console.log('Auth state cleared, redirecting to login...')
      
      // Use replace instead of href to prevent back button issues
      window.location.replace('/auth/login')
    } catch (error) {
      console.error('Error during signout:', error)
      // Force redirect even if there's an error
      window.location.replace('/auth/login')
    }
  }

  const refreshProfile = async () => {
    console.log('refreshProfile called, current user:', user)
    if (user) {
      const profile = await loadProfile(user.id, true)
      console.log('Profile after refresh:', profile)
      return profile
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