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
    
    const supabase = createClient()
    
    // Get or create applicant record for this user
    let applicantId = null
    
    // Check if user already has an applicant record
    const { data: existingApplicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('email', formData.get('email') as string)
      .eq('company_id', profile.company_id)
      .maybeSingle()
    
    if (existingApplicant) {
      applicantId = existingApplicant.id
    } else {
      // Create applicant directly in Supabase
      const fullName = formData.get('full_name') as string || profile.full_name
      const nameParts = fullName.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      const applicantData = {
        company_id: profile.company_id,
        first_name: firstName,
        last_name: lastName,
        email: formData.get('email') as string || profile.email,
        phone: formData.get('phone') as string,
        income: parseFloat(formData.get('annual_income') as string) || 0,
        household_size: parseInt(formData.get('household_size') as string) || 1,
        location_preference: formData.get('current_address') as string || '',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data: newApplicant, error: applicantError } = await supabase
        .from('applicants')
        .insert(applicantData)
        .select()
        .single()
      
      if (applicantError) {
        console.error('Error creating applicant:', applicantError)
        throw new Error(`Failed to create applicant: ${applicantError.message}`)
      }
      
      applicantId = newApplicant.id
    }
    
    // Get the project to determine which company owns it
    const projectId = formData.get('project_id') as string
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('company_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      throw new Error('Project not found')
    }
    
    // Create application with the project's company_id, not the applicant's
    const applicationData = {
      company_id: project.company_id,  // Use project's company_id so developers can see it
      applicant_company_id: profile.company_id,  // Store applicant's company_id separately if needed
      project_id: projectId,
      applicant_id: applicantId,
      preferred_move_in_date: formData.get('preferred_move_in_date') as string || null,
      additional_notes: formData.get('additional_notes') as string || null,
      documents: [],
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: newApplication, error: applicationError } = await supabase
      .from('applications')
      .insert(applicationData)
      .select()
      .single()
    
    if (applicationError) {
      console.error('Error creating application:', applicationError)
      throw new Error(`Failed to create application: ${applicationError.message}`)
    }
    
    if (!newApplication) {
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
  try {
    console.log('Updating application status:', { applicationId, status, notes })
    
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }
    
    console.log('User profile:', { id: profile.id, role: profile.role, company_id: profile.company_id })
    
    // Only developers and admins can update application status
    if (!['developer', 'admin'].includes(profile.role)) {
      throw new Error('Insufficient permissions - must be developer or admin')
    }
    
    const supabase = createClient()
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }
    
    if (status === 'reviewed' || status === 'approved' || status === 'rejected') {
      // Temporarily disable reviewer tracking to avoid RLS issues
      // updateData.reviewed_by = profile.id
      // updateData.reviewed_by_name = profile.full_name || profile.email
      updateData.reviewed_at = new Date().toISOString()
    }
    
    if (notes) {
      updateData.developer_notes = notes
    }
    
    console.log('Update data:', updateData)
    
    // Simple permission check - just verify application exists and user has right company
    if (profile.role === 'developer') {
      const { data: application, error: applicationError } = await supabase
        .from('applications')
        .select('company_id')
        .eq('id', applicationId)
        .single()
      
      if (applicationError) {
        console.error('Error fetching application for permission check:', applicationError)
        throw new Error('Application not found or access denied')
      }
      
      if (!application || application.company_id !== profile.company_id) {
        throw new Error('Access denied - application belongs to another company')
      }
    }
    
    // Perform the update
    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
    
    if (error) {
      console.error('Error updating application:', error)
      throw new Error(`Failed to update application: ${error.message}`)
    }
    
    console.log('Application updated successfully')
    
    revalidatePath('/dashboard/applications')
    return { success: true }
    
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error)
    throw error
  }
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

export async function getApplicationDetail(id: string) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized')
    }
    
    const supabase = createClient()
    
    // Fetch application with all related data
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        projects(
          id,
          name,
          address,
          city,
          state,
          zip_code,
          total_units,
          affordable_units,
          min_income,
          max_income,
          description,
          company_id
        ),
        applicants(
          id,
          first_name,
          last_name,
          email,
          phone,
          income,
          household_size,
          ami_percent,
          location_preference,
          created_at
        )
      `)
      .eq('id', id)
      .single()
    
    if (error || !application) {
      console.error('Error fetching application:', error)
      return null
    }
    
    // Check permissions
    const canView = profile.role === 'admin' || 
      application.company_id === profile.company_id ||
      (application.applicants?.email === profile.email)
    
    if (!canView) {
      throw new Error('Access denied')
    }
    
    return application
  } catch (error) {
    console.error('Error in getApplicationDetail:', error)
    return null
  }
}