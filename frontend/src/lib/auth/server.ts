import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const session = await getSession()
  return session?.user || null
}

export const getUserProfile = cache(async () => {
  const user = await getUser()
  if (!user) return null
  
  const supabase = createClient()
  
  // First, check if profile exists
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()
  
  if (error || !profile) {
    // Create profile if it doesn't exist
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: user.user_metadata?.role || 'buyer',
        company_id: user.user_metadata?.company_id || null
      })
      .select('*, company:companies(*)')
      .single()
    
    return newProfile
  }
  
  return profile
})