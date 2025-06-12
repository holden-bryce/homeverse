'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']

export async function createProject(formData: FormData) {
  const profile = await getUserProfile()
  if (!profile || !profile.company_id) {
    return { error: 'Unauthorized or no company assigned' }
  }
  
  const supabase = createClient()
  
  const projectData: ProjectInsert = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zip_code: formData.get('zip_code') as string,
    total_units: parseInt(formData.get('total_units') as string) || 0,
    affordable_units: parseInt(formData.get('affordable_units') as string) || 0,
    ami_levels: JSON.parse(formData.get('ami_levels') as string || '[]'),
    latitude: parseFloat(formData.get('latitude') as string) || 40.7128,
    longitude: parseFloat(formData.get('longitude') as string) || -74.0060,
    company_id: profile.company_id,
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
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/projects')
  redirect(`/dashboard/projects/${data.id}`)
}

export async function updateProject(id: string, formData: FormData) {
  const profile = await getUserProfile()
  if (!profile || !profile.company_id) {
    return { error: 'Unauthorized' }
  }
  
  const supabase = createClient()
  
  const updateData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zip_code: formData.get('zip_code') as string,
    total_units: parseInt(formData.get('total_units') as string) || 0,
    affordable_units: parseInt(formData.get('affordable_units') as string) || 0,
    ami_levels: JSON.parse(formData.get('ami_levels') as string || '[]'),
    status: formData.get('status') as string || 'planning',
    updated_at: new Date().toISOString(),
  }
  
  const { error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .eq('company_id', profile.company_id)
  
  if (error) {
    console.error('Error updating project:', error)
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/projects/${id}`)
  redirect(`/dashboard/projects/${id}`)
}

export async function deleteProject(id: string) {
  const profile = await getUserProfile()
  if (!profile || !profile.company_id) {
    return { error: 'Unauthorized' }
  }
  
  const supabase = createClient()
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('company_id', profile.company_id)
  
  if (error) {
    console.error('Error deleting project:', error)
    return { error: error.message }
  }
  
  revalidatePath('/dashboard/projects')
  redirect('/dashboard/projects')
}