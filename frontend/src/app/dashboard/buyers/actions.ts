'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'

export async function saveBuyerPreferences(formData: FormData) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }
    
    // Only buyers and applicants can save preferences
    if (profile.role !== 'buyer' && profile.role !== 'applicant') {
      throw new Error('Only buyers can save preferences')
    }
    
    const supabase = createClient()
    
    // Parse form data
    const preferences = {
      household_size: parseInt(formData.get('household_size') as string) || 1,
      annual_income: parseFloat(formData.get('annual_income') as string) || 0,
      preferred_unit_types: JSON.parse(formData.get('preferred_unit_types') as string || '[]'),
      max_commute: parseInt(formData.get('max_commute') as string) || 30,
      min_transit_score: parseInt(formData.get('min_transit_score') as string) || 0,
      min_school_rating: parseInt(formData.get('min_school_rating') as string) || 0,
      selected_amenities: JSON.parse(formData.get('selected_amenities') as string || '[]'),
      notification_preferences: JSON.parse(formData.get('notification_preferences') as string || '{}'),
    }
    
    // Store preferences in profile or create a separate buyer_preferences table
    const { error } = await supabase
      .from('profiles')
      .update({
        preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
    
    if (error) {
      console.error('Error saving buyer preferences:', error)
      throw new Error(`Failed to save preferences: ${error.message}`)
    }
    
    revalidatePath('/dashboard/buyers/preferences')
    revalidatePath('/dashboard/buyers')
    
    return { success: true }
  } catch (error) {
    console.error('Error in saveBuyerPreferences:', error)
    throw error
  }
}

export async function getBuyerPreferences() {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', profile.id)
      .single()
    
    if (error) {
      console.error('Error getting buyer preferences:', error)
      // Return default preferences if none exist
      return {
        household_size: 1,
        annual_income: 0,
        preferred_unit_types: [],
        max_commute: 30,
        min_transit_score: 0,
        min_school_rating: 0,
        selected_amenities: [],
        notification_preferences: {
          newMatches: true,
          applicationUpdates: true,
          priceChanges: false,
          weeklyDigest: false,
        }
      }
    }
    
    return data?.preferences || {}
  } catch (error) {
    console.error('Error in getBuyerPreferences:', error)
    throw error
  }
}