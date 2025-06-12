import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Applicant = Database['public']['Tables']['applicants']['Row']

export const getApplicants = cache(async (companyId: string): Promise<Applicant[]> => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('applicants')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching applicants:', error)
    return []
  }
  
  return data || []
})

export const getApplicantById = cache(async (id: string, companyId: string): Promise<Applicant | null> => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('applicants')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()
  
  if (error) {
    console.error('Error fetching applicant:', error)
    return null
  }
  
  return data
})

export const getApplicantStats = cache(async (companyId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('applicants')
    .select('status')
    .eq('company_id', companyId)
  
  if (error || !data) {
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    }
  }
  
  const stats = data.reduce((acc, applicant) => {
    acc.total++
    acc[applicant.status as keyof typeof acc]++
    return acc
  }, { total: 0, pending: 0, approved: 0, rejected: 0 })
  
  return stats
})