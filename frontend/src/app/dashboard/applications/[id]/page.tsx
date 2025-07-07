import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ApplicationActions } from '@/components/applications/application-actions'
import { 
  FileText, 
  User, 
  Building2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  Mail,
  Phone,
  DollarSign,
  Users,
  MapPin,
  Home,
  ArrowLeft,
  Edit,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface ApplicationDetailPageProps {
  params: { id: string }
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
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
  
  // Get application with all related data
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
        description
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
    .eq('id', params.id)
    .single()
  
  // If error fetching with joins, try simpler query
  if (error || !application) {
    const { data: simpleApp } = await supabase
      .from('applications')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (!simpleApp) {
      notFound()
    }
    
    // For simple app, we'll show limited info
    return <SimpleApplicationView application={simpleApp} profile={profile} />
  }
  
  // Check permissions
  const canView = profile.role === 'admin' || 
    application.company_id === profile.company_id ||
    (application.applicants?.email === profile.email)
  
  if (!canView) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this application.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }
  
  const canUpdateStatus = (profile.role === 'developer' || profile.role === 'admin') && 
    application.company_id === profile.company_id
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <FileText className="h-4 w-4" />
      case 'under_review':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'withdrawn':
        return <XCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }
  
  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/applications">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
            <p className="text-gray-600 mt-1">
              Submitted on {new Date(application.submitted_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <Badge className={`${getStatusColor(application.status)} border rounded-full px-4 py-2`}>
            <span className="flex items-center gap-2 text-sm font-medium">
              {getStatusIcon(application.status)}
              {application.status.replace('_', ' ').toUpperCase()}
            </span>
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">
                    {application.applicants?.first_name} {application.applicants?.last_name}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {application.applicants?.email || 'Not provided'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {application.applicants?.phone || 'Not provided'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Annual Income</p>
                  <p className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    {formatCurrency(application.applicants?.income)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Household Size</p>
                  <p className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    {application.applicants?.household_size || 'Not specified'} {application.applicants?.household_size === 1 ? 'person' : 'people'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">AMI Percentage</p>
                  <p className="font-medium">
                    {application.applicants?.ami_percent ? `${application.applicants.ami_percent}%` : 'Not calculated'}
                  </p>
                </div>
              </div>
              
              {application.applicants?.location_preference && (
                <div>
                  <p className="text-sm text-gray-500">Location Preference</p>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {application.applicants.location_preference}
                  </p>
                </div>
              )}
              
              <div className="pt-2">
                <p className="text-sm text-gray-500">Applicant Since</p>
                <p className="font-medium">
                  {new Date(application.applicants?.created_at || application.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-600" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Project Name</p>
                <p className="font-medium text-lg">{application.projects?.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">
                  {application.projects?.address}<br />
                  {application.projects?.city}, {application.projects?.state} {application.projects?.zip_code}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Units</p>
                  <p className="font-medium flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-400" />
                    {application.projects?.total_units || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Affordable Units</p>
                  <p className="font-medium flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-400" />
                    {application.projects?.affordable_units || 'N/A'}
                  </p>
                </div>
              </div>
              
              {(application.projects?.min_income || application.projects?.max_income) && (
                <div>
                  <p className="text-sm text-gray-500">Income Range</p>
                  <p className="font-medium">
                    {formatCurrency(application.projects?.min_income)} - {formatCurrency(application.projects?.max_income)}
                  </p>
                </div>
              )}
              
              {application.projects?.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{application.projects.description}</p>
                </div>
              )}
              
              <div className="pt-2">
                <Link href={`/dashboard/projects/${application.project_id}`}>
                  <Button variant="outline" size="sm">
                    View Project Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-teal-600" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.preferred_move_in_date && (
                <div>
                  <p className="text-sm text-gray-500">Preferred Move-in Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {new Date(application.preferred_move_in_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              
              {application.additional_notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Applicant Notes</p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{application.additional_notes}</p>
                  </div>
                </div>
              )}
              
              {application.developer_notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Developer Notes</p>
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <p className="text-teal-700">{application.developer_notes}</p>
                  </div>
                </div>
              )}
              
              {!application.additional_notes && !application.developer_notes && (
                <p className="text-gray-500 text-sm">No additional notes provided.</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-600" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-teal-600 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Application Submitted</p>
                    <p className="text-xs text-gray-500">
                      {new Date(application.submitted_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                {application.reviewed_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-teal-600 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Status Updated</p>
                      <p className="text-xs text-gray-500">
                        {new Date(application.reviewed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {application.reviewed_by && (
                        <p className="text-xs text-gray-500 mt-1">
                          By: {application.reviewed_by}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    ['approved', 'rejected', 'withdrawn'].includes(application.status) 
                      ? 'bg-teal-600' 
                      : 'bg-gray-300'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-400">Final Decision</p>
                    <p className="text-xs text-gray-400">
                      {['approved', 'rejected', 'withdrawn'].includes(application.status) 
                        ? `Application ${application.status}`
                        : 'Pending'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Actions */}
          {canUpdateStatus && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ApplicationActions 
                  applicationId={application.id}
                  currentStatus={application.status}
                />
              </CardContent>
            </Card>
          )}
          
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Application ID</span>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {application.id.slice(0, 8)}...
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Days Since Submission</span>
                <span className="font-medium">
                  {Math.floor((Date.now() - new Date(application.submitted_at).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
              
              {application.reviewed_at && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Review Time</span>
                    <span className="font-medium">
                      {Math.floor((new Date(application.reviewed_at).getTime() - new Date(application.submitted_at).getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Simple view for when joins fail
function SimpleApplicationView({ application, profile }: { application: any, profile: any }) {
  return (
    <div className="p-6">
      <Link href="/dashboard/applications">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>
            Application ID: {application.id}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge>{application.status}</Badge>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Submitted</p>
              <p>{new Date(application.submitted_at).toLocaleDateString()}</p>
            </div>
            
            {application.additional_notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p>{application.additional_notes}</p>
              </div>
            )}
            
            {application.developer_notes && (
              <div>
                <p className="text-sm text-gray-500">Developer Notes</p>
                <p>{application.developer_notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}