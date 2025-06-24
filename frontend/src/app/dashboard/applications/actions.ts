'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createApplication(formData: FormData) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }
    
    const { cookies } = await import('next/headers')
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('token')?.value
    if (!token) {
      throw new Error('No authentication token found')
    }
    
    const supabase = createClient()
    
    // Get or create applicant record for this user
    let applicantId = null
    
    // Check if user already has an applicant record
    const { data: existingApplicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('email', formData.get('email') as string)
      .eq('company_id', profile.company_id)
      .single()
    
    if (existingApplicant) {
      applicantId = existingApplicant.id
    } else {
      // Create applicant via API with proper name handling
      const fullName = formData.get('full_name') as string || profile.full_name
      const nameParts = fullName.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      const applicantData = {
        first_name: firstName,
        last_name: lastName,
        email: formData.get('email') as string || profile.email,
        phone: formData.get('phone') as string,
        income: parseFloat(formData.get('annual_income') as string) || 0,
        household_size: parseInt(formData.get('household_size') as string) || 1
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/v1/applicants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicantData)
      })
      
      if (!response.ok) {
        const error = await response.text()
        console.error('Error creating applicant:', error)
        throw new Error(`Failed to create applicant: ${error}`)
      }
      
      const newApplicant = await response.json()
      applicantId = newApplicant.id
    }
    
    // Create application via API
    const applicationData = {
      project_id: formData.get('project_id') as string,
      applicant_id: applicantId,
      preferred_move_in_date: formData.get('preferred_move_in_date') as string || null,
      additional_notes: formData.get('additional_notes') as string || null,
      documents: []
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const applicationResponse = await fetch(`${apiUrl}/api/v1/applications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(applicationData)
    })
    
    if (!applicationResponse.ok) {
      const error = await applicationResponse.text()
      console.error('Error creating application:', error)
      throw new Error(`Failed to create application: ${error}`)
    }
    
    const data = await applicationResponse.json()
    
    if (!data) {
      throw new Error('No data returned after creating application')
    }
    
    revalidatePath('/dashboard/applications')
    revalidatePath('/dashboard/buyers')
    
    // Redirect to success page
    redirect('/dashboard/buyers?tab=applications&success=true')
  } catch (error) {
    console.error('Error in createApplication:', error)
    throw error
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  notes?: string
) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  
  // Only developers and admins can update application status
  if (!['developer', 'admin'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }
  
  const supabase = createClient()
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }
  
  if (status === 'reviewed' || status === 'approved' || status === 'rejected') {
    updateData.reviewed_by = profile.id
    updateData.reviewed_at = new Date().toISOString()
  }
  
  if (notes) {
    updateData.developer_notes = notes
  }
  
  const { error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', applicationId)
    .eq('company_id', profile.company_id)
  
  if (error) {
    console.error('Error updating application:', error)
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/applications')
  return { success: true }
}

export async function deleteApplication(id: string) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  
  const supabase = createClient()
  
  // Check if user owns the application or is admin
  const { data: application } = await supabase
    .from('applications')
    .select('applicant_id')
    .eq('id', id)
    .single()
    
  if (!application) {
    throw new Error('Application not found')
  }
  
  // Delete the application
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting application:', error)
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/applications')
  redirect('/dashboard/applications')
}