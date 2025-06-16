'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function simpleCreateApplicant(formData: FormData) {
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Create applicant with minimal data
  const { data, error } = await supabase
    .from('applicants')
    .insert({
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || null,
      household_size: parseInt(formData.get('household_size') as string) || 1,
      income: parseFloat(formData.get('income') as string) || 0,
      ami_percent: parseFloat(formData.get('ami_percent') as string) || 0,
      location_preference: formData.get('location_preference') as string || null,
      latitude: parseFloat(formData.get('latitude') as string) || 40.7128,
      longitude: parseFloat(formData.get('longitude') as string) || -74.0060,
      company_id: user.id, // Use user ID as company ID temporarily
      user_id: user.id,
      status: 'pending',
    })
    .select()
    .single()
  
  if (error) {
    console.error('Database error:', error)
    throw new Error(`Database error: ${error.message}`)
  }
  
  revalidatePath('/dashboard/applicants')
  redirect(`/dashboard/applicants/${data.id}`)
}