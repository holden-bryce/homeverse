'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function submitApplication(formData: FormData) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }
    
    const supabase = createClient()
    
    // Convert form field names from camelCase to snake_case
    const applicationData = {
      project_id: formData.get('project_id') as string,
      applicant_id: profile.id, // User applying as themselves
      first_name: formData.get('firstName') as string,
      last_name: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      household_size: parseInt(formData.get('householdSize') as string) || 1,
      annual_income: parseFloat(formData.get('annualIncome') as string) || 0,
      preferred_unit_type: formData.get('preferredUnitType') as string,
      move_in_date: formData.get('moveInDate') as string || null,
      employment_status: formData.get('employmentStatus') as string || null,
      current_address: formData.get('currentAddress') as string || null,
      emergency_contact: formData.get('emergencyContact') as string || null,
      emergency_phone: formData.get('emergencyPhone') as string || null,
      additional_info: formData.get('additionalInfo') as string || null,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    }
    
    const { data, error } = await supabase
      .from('applications')
      .insert([applicationData])
      .select()
      .single()
    
    if (error) {
      console.error('Error submitting application:', error)
      throw new Error(`Failed to submit application: ${error.message}`)
    }
    
    if (!data) {
      throw new Error('No data returned after submitting application')
    }
    
    revalidatePath('/dashboard/applications')
    revalidatePath('/dashboard/buyers')
    
    // Redirect based on user role
    if (profile.role === 'buyer' || profile.role === 'applicant') {
      redirect('/dashboard/buyers?tab=applications')
    } else {
      redirect('/dashboard/applications')
    }
  } catch (error) {
    console.error('Error in submitApplication:', error)
    throw error
  }
}

export async function updateApplicationStatus(id: string, status: string) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  
  // Only developers and admins can update application status
  if (profile.role !== 'developer' && profile.role !== 'admin') {
    throw new Error('Unauthorized to update application status')
  }
  
  const supabase = createClient()
  
  const { error } = await supabase
    .from('applications')
    .update({ 
      status,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
  
  if (error) {
    console.error('Error updating application status:', error)
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/applications')
  revalidatePath(`/dashboard/applications/${id}`)
}