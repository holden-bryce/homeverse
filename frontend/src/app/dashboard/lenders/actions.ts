'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createInvestment(formData: FormData) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }
    
    // Check if user is a lender
    if (profile.role !== 'lender' && profile.role !== 'admin') {
      throw new Error('Only lenders can create investments')
    }
    
    const supabase = createClient()
    
    // Prepare investment data
    const investmentData = {
      project_id: formData.get('project_id') as string,
      lender_id: profile.id,
      amount: parseFloat(formData.get('amount') as string) || 0,
      investment_type: formData.get('investment_type') as string || 'loan', // You'll need to check valid types
      interest_rate: parseFloat(formData.get('interest_rate') as string) || 0,
      term_months: parseInt(formData.get('term_months') as string) || 0,
      status: 'pending',
    }
    
    const { data, error } = await supabase
      .from('investments')
      .insert([investmentData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating investment:', error)
      throw new Error(`Failed to create investment: ${error.message}`)
    }
    
    if (!data) {
      throw new Error('No data returned after creating investment')
    }
    
    revalidatePath('/dashboard/lenders/investments')
    redirect('/dashboard/lenders/investments')
  } catch (error) {
    console.error('Error in createInvestment:', error)
    throw error
  }
}

export async function updateInvestment(id: string, formData: FormData) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Unauthorized')
  }
  
  if (profile.role !== 'lender' && profile.role !== 'admin') {
    throw new Error('Only lenders can update investments')
  }
  
  const supabase = createClient()
  
  const updateData = {
    amount: parseFloat(formData.get('amount') as string) || 0,
    investment_type: formData.get('investment_type') as string,
    interest_rate: parseFloat(formData.get('interest_rate') as string) || 0,
    term_months: parseInt(formData.get('term_months') as string) || 0,
    status: formData.get('status') as string,
    updated_at: new Date().toISOString(),
  }
  
  const { error } = await supabase
    .from('investments')
    .update(updateData)
    .eq('id', id)
    .eq('lender_id', profile.id)
  
  if (error) {
    console.error('Error updating investment:', error)
    throw new Error(error.message)
  }
  
  revalidatePath('/dashboard/lenders/investments')
  revalidatePath(`/dashboard/lenders/investments/${id}`)
  redirect(`/dashboard/lenders/investments/${id}`)
}