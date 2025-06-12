import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { RealtimeApplicantsList } from '@/components/realtime/applicants-list'

export default async function ApplicantsPage() {
  const profile = await getUserProfile()
  if (!profile || !profile.company_id) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Company Assigned</CardTitle>
            <CardDescription>
              Please contact your administrator to be assigned to a company.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }
  
  const supabase = createClient()
  
  const { data: applicants, error } = await supabase
    .from('applicants')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching applicants:', error)
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applicants</h1>
          <p className="text-gray-600">Manage your housing applicants</p>
        </div>
        <Link href="/dashboard/applicants/new">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Applicant
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Applicants</CardTitle>
          <CardDescription>
            {applicants?.length || 0} total applicants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RealtimeApplicantsList 
            initialApplicants={applicants || []} 
            companyId={profile.company_id}
          />
        </CardContent>
      </Card>
    </div>
  )
}