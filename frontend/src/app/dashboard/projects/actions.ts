'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']

export async function createProject(formData: FormData) {
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
    
    // Prepare project data matching the database schema
    const projectData: ProjectInsert = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string || 'CA',
      zip_code: formData.get('zip_code') as string,
      total_units: parseInt(formData.get('total_units') as string) || 0,
      affordable_units: parseInt(formData.get('affordable_units') as string) || 0,
      ami_levels: JSON.parse(formData.get('ami_levels') as string || '[]'),
      latitude: parseFloat(formData.get('latitude') as string) || 40.7128,
      longitude: parseFloat(formData.get('longitude') as string) || -74.0060,
      company_id: companyId,
      user_id: profile.id,
      status: 'planning',
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating project:', error)
      throw new Error(`Failed to create project: ${error.message}`)
    }
    
    if (!data) {
      throw new Error('No data returned after creating project')
    }
    
    revalidatePath('/dashboard/projects')
    // Redirect to success page to avoid loading issues
    redirect('/dashboard/projects/success')
  } catch (error) {
    console.error('Error in createProject:', error)
    throw error
  }
}

export async function updateProject(id: string, formData: FormData) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  
  const supabase = createClient()
  
  const updateData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string || 'CA',
    zip_code: formData.get('zip_code') as string,
    total_units: parseInt(formData.get('total_units') as string) || 0,
    affordable_units: parseInt(formData.get('affordable_units') as string) || 0,
    ami_levels: JSON.parse(formData.get('ami_levels') as string || '[]'),
    status: formData.get('status') as string || 'planning',
    updated_at: new Date().toISOString(),
  }
  
  // If user has a company_id, use it to filter. Otherwise, just filter by user_id
  const query = supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
  
  if (profile.company_id) {
    query.eq('company_id', profile.company_id)
  } else {
    query.eq('user_id', profile.id)
  }
  
  const { error } = await query
  
  if (error) {
    console.error('Error updating project:', error)
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/projects/${id}`)
  redirect(`/dashboard/projects/${id}`)
}

export async function deleteProject(id: string) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  
  const supabase = createClient()
  
  // If user has a company_id, use it to filter. Otherwise, just filter by user_id
  const query = supabase
    .from('projects')
    .delete()
    .eq('id', id)
  
  if (profile.company_id) {
    query.eq('company_id', profile.company_id)
  } else {
    query.eq('user_id', profile.id)
  }
  
  const { error } = await query
  
  if (error) {
    console.error('Error deleting project:', error)
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/projects')
  redirect('/dashboard/projects')
}