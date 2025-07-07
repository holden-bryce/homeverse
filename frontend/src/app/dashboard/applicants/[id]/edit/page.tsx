import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { EditApplicantForm } from '@/components/applicants/edit-applicant-form'

interface EditApplicantPageProps {
  params: {
    id: string
  }
}

export default async function EditApplicantPage({ params }: EditApplicantPageProps) {
  const profile = await getUserProfile()
  
  if (!profile) {
    notFound()
  }
  
  const supabase = createClient()
  
  // Get applicant data
  const { data: applicant, error } = await supabase
    .from('applicants')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (error || !applicant) {
    notFound()
  }
  
  // Check permissions
  const canEdit = profile.role === 'admin' || 
    (profile.company_id === applicant.company_id && ['developer', 'admin'].includes(profile.role))
  
  if (!canEdit) {
    notFound()
  }
  
  return <EditApplicantForm applicant={applicant} />
}