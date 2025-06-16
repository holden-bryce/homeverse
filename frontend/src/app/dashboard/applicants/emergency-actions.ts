'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function emergencyCreateApplicant(formData: FormData) {
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Get user's profile to get company_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()
  
  const company_id = profile?.company_id || '11111111-1111-1111-1111-111111111111'
  
  // Create a temporary record in a different table to store applicant data
  // For now, we'll use the contact_submissions table as a workaround
  const applicantData = {
    name: `${formData.get('first_name')} ${formData.get('last_name')}`,
    email: formData.get('email') as string,
    subject: 'New Applicant',
    message: JSON.stringify({
      type: 'applicant',
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      phone: formData.get('phone'),
      household_size: formData.get('household_size'),
      income: formData.get('income'),
      ami_percent: formData.get('ami_percent'),
      location_preference: formData.get('location_preference'),
      company_id: company_id,
      user_id: user.id
    })
  }
  
  const { data, error } = await supabase
    .from('contact_submissions')
    .insert([applicantData])
    .select()
    .single()
  
  if (error) {
    console.error('Database error:', error)
    throw new Error(`Failed to create applicant: ${error.message}`)
  }
  
  // For now, redirect to applicants list with a success message
  revalidatePath('/dashboard/applicants')
  redirect('/dashboard/applicants?success=created')
}