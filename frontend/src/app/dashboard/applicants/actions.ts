'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'

type ApplicantInsert = Database['public']['Tables']['applicants']['Insert']

export async function createApplicant(formData: FormData) {
  const profile = await getUserProfile()
  if (!profile || !profile.company_id) {
    throw new Error('Unauthorized or no company assigned')
  }
  
  const supabase = createClient()
  
  const applicantData: ApplicantInsert = {
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
    company_id: profile.company_id,
    user_id: profile.id,
    status: 'pending',
  }
  
  const { data, error } = await supabase
    .from('applicants')
    .insert([applicantData])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating applicant:', error)
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/applicants')
  redirect(`/dashboard/applicants/${data.id}`)
}

export async function updateApplicant(id: string, formData: FormData) {
  const profile = await getUserProfile()
  if (!profile || !profile.company_id) {
    throw new Error('Unauthorized')
  }
  
  const supabase = createClient()
  
  const updateData = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string || null,
    household_size: parseInt(formData.get('household_size') as string) || 1,
    income: parseFloat(formData.get('income') as string) || 0,
    ami_percent: parseFloat(formData.get('ami_percent') as string) || 0,
    location_preference: formData.get('location_preference') as string || null,
    status: formData.get('status') as string || 'pending',
    updated_at: new Date().toISOString(),
  }
  
  const { error } = await supabase
    .from('applicants')
    .update(updateData)
    .eq('id', id)
    .eq('company_id', profile.company_id)
  
  if (error) {
    console.error('Error updating applicant:', error)
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/applicants')
  revalidatePath(`/dashboard/applicants/${id}`)
  redirect(`/dashboard/applicants/${id}`)
}

export async function deleteApplicant(id: string) {
  const profile = await getUserProfile()
  if (!profile || !profile.company_id) {
    throw new Error('Unauthorized')
  }
  
  const supabase = createClient()
  
  const { error } = await supabase
    .from('applicants')
    .delete()
    .eq('id', id)
    .eq('company_id', profile.company_id)
  
  if (error) {
    console.error('Error deleting applicant:', error)
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/applicants')
  redirect('/dashboard/applicants')
}