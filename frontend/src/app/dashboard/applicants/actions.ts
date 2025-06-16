'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'

type ApplicantInsert = Database['public']['Tables']['applicants']['Insert']

export async function createApplicant(formData: FormData) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }
    
    const supabase = createClient()
    
    // If user doesn't have a company, create a default one
    let companyId = profile.company_id
    
    if (!companyId) {
      // Create a default company for the user
      const companyKey = `company_${profile.id.slice(0, 8)}`
      
      // Check if company already exists with this key
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('key', companyKey)
        .single()
      
      if (existingCompany) {
        companyId = existingCompany.id
      } else {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: `${profile.full_name || profile.email || 'User'}'s Company`,
            key: companyKey,
            plan: 'trial',
            seats: 5
          })
          .select()
          .single()
        
        if (companyError) {
          console.error('Error creating company:', companyError)
          throw new Error(`Unable to create company: ${companyError.message}`)
        }
        
        companyId = company.id
      }
      
      // Update user profile with company_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: companyId })
        .eq('id', profile.id)
      
      if (profileError) {
        console.error('Error updating profile with company_id:', profileError)
      }
    }
    
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
      company_id: companyId,
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
      throw new Error(`Failed to create applicant: ${error.message}`)
    }
    
    if (!data) {
      throw new Error('No data returned after creating applicant')
    }
    
    revalidatePath('/dashboard/applicants')
    redirect(`/dashboard/applicants/${data.id}`)
  } catch (error) {
    console.error('Error in createApplicant:', error)
    throw error
  }
}

export async function updateApplicant(id: string, formData: FormData) {
  const profile = await getUserProfile()
  if (!profile) {
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
  
  // If user has a company_id, use it to filter. Otherwise, just filter by user_id
  const query = supabase
    .from('applicants')
    .update(updateData)
    .eq('id', id)
  
  if (profile.company_id) {
    query.eq('company_id', profile.company_id)
  } else {
    query.eq('user_id', profile.id)
  }
  
  const { error } = await query
  
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
  if (!profile) {
    throw new Error('Unauthorized')
  }
  
  const supabase = createClient()
  
  // If user has a company_id, use it to filter. Otherwise, just filter by user_id
  const query = supabase
    .from('applicants')
    .delete()
    .eq('id', id)
  
  if (profile.company_id) {
    query.eq('company_id', profile.company_id)
  } else {
    query.eq('user_id', profile.id)
  }
  
  const { error } = await query
  
  if (error) {
    console.error('Error deleting applicant:', error)
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/applicants')
  redirect('/dashboard/applicants')
}