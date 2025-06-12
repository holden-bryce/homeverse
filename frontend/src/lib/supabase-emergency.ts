import { createBrowserClient } from '@supabase/ssr'

// EMERGENCY SUPABASE CLIENT - No profile loading, no auth providers

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Emergency Supabase Client: Initializing')

// Create a minimal Supabase client
export const supabaseEmergency = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,  // Disable auto refresh to prevent background calls
      persistSession: true,     // Keep session but don't auto-check
      detectSessionInUrl: false // Don't check URL for session
    }
  }
)

// Emergency sign in - NO profile loading
export const emergencySignIn = async (email: string, password: string) => {
  console.log('Emergency Sign In: Starting...')
  
  try {
    const { data, error } = await supabaseEmergency.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Emergency Sign In: Error', error)
      throw error
    }
    
    console.log('Emergency Sign In: Success!', data.user?.email)
    
    // DO NOT load profile, DO NOT trigger any subscriptions
    // Just return the auth data
    return data
  } catch (error) {
    console.error('Emergency Sign In: Failed', error)
    throw error
  }
}

// Emergency session check - minimal, no profile
export const emergencyGetSession = async () => {
  try {
    const { data: { session } } = await supabaseEmergency.auth.getSession()
    return session
  } catch (error) {
    console.error('Emergency Session Check: Failed', error)
    return null
  }
}

// Emergency sign out
export const emergencySignOut = async () => {
  try {
    await supabaseEmergency.auth.signOut()
    // Clear all local storage to ensure clean logout
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
  } catch (error) {
    console.error('Emergency Sign Out: Failed', error)
  }
}