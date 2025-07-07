'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']

export async function createProject(formData: FormData) {
  console.log('=== Project Creation Debug ===')
  console.log('Form data entries:')
  // Convert to array to avoid TypeScript iteration issues
  const entries = Array.from(formData.entries())
  entries.forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`)
  })
  
  try {
    const profile = await getUserProfile()
    console.log('User profile:', profile)
    
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
    
    console.log('Project data to insert:', JSON.stringify(projectData, null, 2))
    
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
    redirect('/dashboard/projects')
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
  
  // Helper function to parse comma-separated values
  const parseCommaSeparated = (value: string | null): string[] => {
    if (!value) return []
    return value.split(',').map(item => item.trim()).filter(item => item.length > 0)
  }

  const updateData = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string || 'CA',
    zip_code: formData.get('zip_code') as string,
    total_units: parseInt(formData.get('total_units') as string) || 0,
    affordable_units: parseInt(formData.get('affordable_units') as string) || 0,
    ami_levels: parseCommaSeparated(formData.get('ami_levels') as string),
    status: formData.get('status') as string || 'planning',
    price_range: formData.get('price_range') as string || null,
    
    // Unit details
    bedrooms: formData.get('bedrooms') ? parseInt(formData.get('bedrooms') as string) : null,
    bathrooms: formData.get('bathrooms') ? parseFloat(formData.get('bathrooms') as string) : null,
    square_feet: formData.get('square_feet') ? parseInt(formData.get('square_feet') as string) : null,
    unit_types: parseCommaSeparated(formData.get('unit_types') as string),
    monthly_rent: formData.get('monthly_rent') ? parseFloat(formData.get('monthly_rent') as string) : null,
    estimated_delivery: formData.get('estimated_delivery') as string || null,
    
    // Amenities & features
    amenities: parseCommaSeparated(formData.get('amenities') as string),
    pet_policy: formData.get('pet_policy') as string || null,
    parking: formData.get('parking') as string || null,
    laundry: formData.get('laundry') as string || null,
    
    // Fees & costs
    application_fee: formData.get('application_fee') ? parseFloat(formData.get('application_fee') as string) : null,
    security_deposit: formData.get('security_deposit') ? parseFloat(formData.get('security_deposit') as string) : null,
    move_in_cost: formData.get('move_in_cost') ? parseFloat(formData.get('move_in_cost') as string) : null,
    
    // Transportation & area
    transit_notes: formData.get('transit_notes') as string || null,
    school_district: formData.get('school_district') as string || null,
    walk_score: formData.get('walk_score') ? parseInt(formData.get('walk_score') as string) : null,
    transit_score: formData.get('transit_score') ? parseInt(formData.get('transit_score') as string) : null,
    
    // Contact information
    contact_email: formData.get('contact_email') as string || null,
    contact_phone: formData.get('contact_phone') as string || null,
    website: formData.get('website') as string || null,
    
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

export async function uploadProjectImage(
  projectId: string,
  formData: FormData
) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  
  const supabase = createClient()
  
  // Verify project belongs to user's company
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('company_id', profile.company_id)
    .single()
    
  if (!project) {
    throw new Error('Project not found or unauthorized')
  }
  
  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.')
  }
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 5MB.')
  }
  
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}/${Date.now()}.${fileExt}`
    const filePath = `projects/${fileName}`
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })
      
    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload image')
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-images')
      .getPublicUrl(filePath)
    
    // Update project with new image
    const images = project.images || []
    const newImage = {
      id: crypto.randomUUID(),
      url: publicUrl,
      caption: formData.get('caption') as string || null,
      is_primary: images.length === 0 || formData.get('is_primary') === 'true',
      uploaded_at: new Date().toISOString()
    }
    
    // If this is primary, unset other primary images
    if (newImage.is_primary) {
      images.forEach((img: any) => { img.is_primary = false })
    }
    
    images.push(newImage)
    
    // Update project
    const { error: updateError } = await supabase
      .from('projects')
      .update({ images })
      .eq('id', projectId)
      
    if (updateError) {
      // Try to delete uploaded file
      await supabase.storage.from('project-images').remove([filePath])
      throw new Error('Failed to update project')
    }
    
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, image: newImage }
  } catch (error) {
    console.error('Image upload error:', error)
    throw error
  }
}

export async function deleteProjectImage(
  projectId: string,
  imageId: string
) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  
  const supabase = createClient()
  
  // Verify project belongs to user's company
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('company_id', profile.company_id)
    .single()
    
  if (!project) {
    throw new Error('Project not found or unauthorized')
  }
  
  // Remove image from array
  const images = project.images || []
  const updatedImages = images.filter((img: any) => img.id !== imageId)
  
  // Update project
  const { error } = await supabase
    .from('projects')
    .update({ images: updatedImages })
    .eq('id', projectId)
    
  if (error) {
    throw new Error('Failed to delete image')
  }
  
  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
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