import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { ApplicationsList } from '@/components/applications/applications-list'

export default async function ApplicationsPage() {
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
  
  // For developers/admins - get all applications for projects in their company
  let applicationsQuery = supabase
    .from('applications')
    .select(`
      *,
      projects!inner(name),
      applicants(first_name, last_name, email, phone)
    `)
    .order('submitted_at', { ascending: false })
  
  // Filter based on role
  if (profile.role === 'developer' || profile.role === 'admin') {
    // Get applications for projects that belong to this company
    applicationsQuery = applicationsQuery.eq('company_id', profile.company_id)
  } else if (profile.role === 'buyer' || profile.role === 'applicant') {
    // For buyers/applicants, get their own applications
    // First get the applicant ID for this user
    const { data: applicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('email', profile.email)
      .eq('company_id', profile.company_id)
      .single()
    
    if (applicant) {
      applicationsQuery = applicationsQuery.eq('applicant_id', applicant.id)
    } else {
      // No applicant record, return empty
      return (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
              <p className="text-gray-600">Review and manage housing applications</p>
            </div>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No applications found</p>
              <p className="text-sm text-gray-400">
                Submit an application for a housing project to see it here.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }
  }
  
  const { data: applications, error } = await applicationsQuery
  
  if (error) {
    console.error('Error fetching applications:', error)
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-600">Review and manage housing applications</p>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Unable to load applications</p>
            <p className="text-sm text-gray-400">
              There was an error loading the applications. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600">Review and manage housing applications</p>
        </div>
      </div>
      
      <ApplicationsList 
        initialApplications={applications || []} 
        userRole={profile.role}
      />
    </div>
  )
}