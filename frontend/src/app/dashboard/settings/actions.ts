'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: {
  full_name: string
  phone?: string
  timezone?: string
  language?: string
}) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  
  const supabase = createClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.full_name,
      phone: data.phone,
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id)
  
  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }
  
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateCompany(data: {
  name: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  phone?: string
  website?: string
  description?: string
}) {
  const profile = await getUserProfile()
  if (!profile || !profile.company_id) {
    throw new Error('Unauthorized or no company assigned')
  }
  
  // Only admins and developers can update company
  if (!['admin', 'developer'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }
  
  const supabase = createClient()
  
  const { error } = await supabase
    .from('companies')
    .update({
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zip_code: data.zip_code,
      phone: data.phone,
      website: data.website,
      description: data.description,
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.company_id)
  
  if (error) {
    throw new Error(`Failed to update company: ${error.message}`)
  }
  
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateNotificationSettings(settings: {
  emailNotifications: boolean
  pushNotifications: boolean
  newMatches: boolean
  projectUpdates: boolean
  applicationUpdates: boolean
  systemMaintenance: boolean
  weeklyReports: boolean
  monthlyReports: boolean
}) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  
  // For now, we'll store these in the profile or a separate settings table
  // This is a placeholder - implement based on your database schema
  console.log('Notification settings to save:', settings)
  
  return { success: true }
}

export async function updateSecuritySettings(settings: {
  twoFactorEnabled: boolean
  sessionTimeout: string
  passwordExpiry: string
  loginAttempts: string
}) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  
  // Security settings would typically be stored in a separate table
  // This is a placeholder - implement based on your security requirements
  console.log('Security settings to save:', settings)
  
  return { success: true }
}