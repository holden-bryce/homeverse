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
  const [profileLoadingRef] = useState({ isLoading: false, userId: null as string | null })
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
      console.log('🔍 Loading profile for user:', userId)
      
      // Prevent recursive loading
      if (profileLoadingRef.isLoading && profileLoadingRef.userId === userId && !forceReload) {
        console.log('Profile already loading for user:', userId)
        return profile // Return existing profile if available
      }
      
      profileLoadingRef.isLoading = true
      profileLoadingRef.userId = userId
      
      // First try to get the profile - simplified approach
      let profileData = null
      
      try {
        console.log('Loading profile for user:', userId)
        
        // Simple query with timeout
        const profilePromise = supabase
          .from('profiles')
          .select('*, companies(*)')
          .eq('id', userId)
          .single()
        
        // Add a longer timeout to prevent hanging (increased from 5s to 15s)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile query timeout')), 15000)
        )
        
        let result
        try {
          result = await Promise.race([profilePromise, timeoutPromise]) as any
        } catch (timeoutError) {
          console.warn('Profile query timed out, attempting direct query...')
          // Try once more without timeout
          result = await profilePromise
        }
        
        if (result?.data) {
          profileData = result.data
          console.log('✅ Profile loaded:', profileData)
        } else if (result?.error) {
          console.log('Profile error:', result.error)
          if (result.error.code === 'PGRST116') {
            console.log('Profile not found, will create...')
          }
        }
      } catch (error: any) {
        console.error('Profile load failed:', error.message || error)
        // Continue to create profile if needed
      }
      
      // If we still don't have a valid profile, fix it
      if (!profileData || !profileData.company_id) {
        console.log('🔧 Profile missing or incomplete, fixing...')
        
        // Get or create default company
        let companyId = 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8' // Use known default company ID
        
        // Verify the default company exists
        const { data: defaultCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('id', companyId)
          .single()
        
        if (!defaultCompany) {
          // Fallback: get any company or create one
          const { data: anyCompany } = await supabase
            .from('companies')
            .select('id')
            .eq('key', 'default-company')
            .single()
          
          if (anyCompany) {
            companyId = anyCompany.id
          } else {
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
        }
        
        // Create or update profile
        if (!profileData) {
          // Get user metadata
          const { data: { user } } = await supabase.auth.getUser()
          
          console.log('Creating new profile with company_id:', companyId)
          // Create profile
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              company_id: companyId,
              role: user?.user_metadata?.role || 'buyer',
              full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
            })
            .select('*, companies(*)')
            .single()
          
          profileData = newProfile
        } else {
          console.log('Updating existing profile with company_id:', companyId)
          // Update existing profile with company_id
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .update({ company_id: companyId })
            .eq('id', userId)
            .select('*, companies(*)')
            .single()
          
          profileData = updatedProfile
        }
        
        console.log('✅ Fixed profile:', profileData)
      }
      
      if (profileData) {
        setProfile(profileData)
        return profileData
      } else {
        console.error('❌ Failed to load or create profile')
        return null
      }
    } catch (error) {
      console.error('❌ Error in loadProfile:', error)
      return null
    } finally {
      profileLoadingRef.isLoading = false
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