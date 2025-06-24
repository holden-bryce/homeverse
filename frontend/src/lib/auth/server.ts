import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getUserProfile = cache(async () => {
  const user = await getUser()
  if (!user) return null
  
  const supabase = createClient()
  
  try {
    // First, check if profile exists
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error || !profile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: user.user_metadata?.role || 'buyer',
          company_id: user.user_metadata?.company_id || null
        })
        .select('*')
        .single()
      
      if (insertError) {
        console.error('Error creating profile:', insertError)
        // Return a minimal profile object
        return {
          id: user.id,
          email: user.email || '',
          full_name: user.email?.split('@')[0] || 'User',
          role: 'buyer',
          company_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
      
      return newProfile
    }
    
    // Add email from auth user if not in profile
    return {
      ...profile,
      email: profile.email || user.email || ''
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    // Return a minimal profile object
    return {
      id: user.id,
      email: user.email || '',
      full_name: user.email?.split('@')[0] || 'User',
      role: 'buyer',
      company_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
})