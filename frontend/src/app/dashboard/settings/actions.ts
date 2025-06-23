'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(formData: FormData) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }
    
    const supabase = createClient()
    
    // Convert field names to match database schema
    const updateData = {
      full_name: `${formData.get('firstName')} ${formData.get('lastName')}`.trim(),
      phone: formData.get('phone') as string || null,
      timezone: formData.get('timezone') as string || 'UTC',
      language: formData.get('language') as string || 'en',
      updated_at: new Date().toISOString(),
    }
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id)
    
    if (error) {
      console.error('Error updating profile:', error)
      throw new Error(`Failed to update profile: ${error.message}`)
    }
    
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    
    return { success: true }
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    throw error
  }
}

export async function updateCompanySettings(formData: FormData) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }
    
    // Only admins can update company settings
    if (profile.role !== 'admin') {
      throw new Error('Only administrators can update company settings')
    }
    
    const supabase = createClient()
    
    const updateData = {
      name: formData.get('name') as string,
      settings: {
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zipCode: formData.get('zipCode') as string,
      },
      updated_at: new Date().toISOString(),
    }
    
    const { error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', profile.company_id)
    
    if (error) {
      console.error('Error updating company settings:', error)
      throw new Error(`Failed to update company settings: ${error.message}`)
    }
    
    revalidatePath('/dashboard/settings')
    
    return { success: true }
  } catch (error) {
    console.error('Error in updateCompanySettings:', error)
    throw error
  }
}

export async function updateNotificationPreferences(formData: FormData) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }
    
    const supabase = createClient()
    
    // Convert form data to notification preferences object
    const notificationPreferences = {
      emailNotifications: formData.get('emailNotifications') === 'true',
      smsNotifications: formData.get('smsNotifications') === 'true',
      applicationUpdates: formData.get('applicationUpdates') === 'true',
      investmentAlerts: formData.get('investmentAlerts') === 'true',
      projectUpdates: formData.get('projectUpdates') === 'true',
      weeklyReports: formData.get('weeklyReports') === 'true',
      marketingEmails: formData.get('marketingEmails') === 'true',
      systemAlerts: formData.get('systemAlerts') === 'true',
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_preferences: notificationPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
    
    if (error) {
      console.error('Error updating notification preferences:', error)
      throw new Error(`Failed to update notification preferences: ${error.message}`)
    }
    
    revalidatePath('/dashboard/settings')
    
    return { success: true }
  } catch (error) {
    console.error('Error in updateNotificationPreferences:', error)
    throw error
  }
}

export async function enableTwoFactor() {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }
    
    // In a real app, this would generate TOTP secret and QR code
    // For now, just update the profile to indicate 2FA is requested
    const supabase = createClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({
        two_factor_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
    
    if (error) {
      console.error('Error enabling 2FA:', error)
      throw new Error(`Failed to enable 2FA: ${error.message}`)
    }
    
    revalidatePath('/dashboard/settings')
    
    return { success: true }
  } catch (error) {
    console.error('Error in enableTwoFactor:', error)
    throw error
  }
}