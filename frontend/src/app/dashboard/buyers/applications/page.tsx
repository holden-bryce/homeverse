'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  MapPin,
  DollarSign,
  Home,
  Loader2,
  User
} from 'lucide-react'
import { useApplications } from '@/lib/supabase/hooks'
import { useAuth } from '@/providers/supabase-auth-provider'

interface Application {
  id: string
  project_id: string
  applicant_id: string
  status: string
  preferred_move_in_date?: string
  additional_notes?: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  developer_notes?: string
  projects?: {
    name: string
    city?: string
    state?: string
    total_units?: number
    affordable_units?: number
  }
  applicants?: {
    first_name?: string
    last_name?: string
  }
}

export default function ApplicationsPage() {
  const router = useRouter()
  const { profile, user } = useAuth()
  
  // Fetch applications for the current user (if they're an applicant)
  const { data: applicationsData, isLoading } = useApplications({
    applicant_id: profile?.role === 'applicant' ? user?.id : undefined
  })
  
  const applications = applicationsData?.data || []

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'under_review':
        return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getApplicationStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'under_review':
        return <Clock className="h-4 w-4" />
      case 'submitted':
        return <FileText className="h-4 w-4" />
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />
      case 'withdrawn':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/buyers')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Portal
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
                <p className="text-gray-600 text-sm">Track your housing applications</p>
              </div>
            </div>
            <Badge className="bg-teal-100 text-teal-800">
              {applications.length} Active Applications
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">
                  Start exploring properties and submit your first application
                </p>
                <Button 
                  onClick={() => router.push('/dashboard/buyers')}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Browse Properties
                </Button>
              </CardContent>
            </Card>
          ) : (
            applications.map((app: Application) => (
              <Card key={app.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{app.projects?.name || 'Unknown Project'}</h3>
                        <Badge className={`${getApplicationStatusColor(app.status)} border rounded-full`}>
                          {getApplicationStatusIcon(app.status)}
                          <span className="ml-1 capitalize">{app.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{app.projects?.city || 'N/A'}, {app.projects?.state || 'CA'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Home className="h-4 w-4" />
                          <span>{app.projects?.affordable_units || 0} affordable units</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>ID: {app.id.slice(0, 8)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Submitted:</span>
                          <span className="ml-2 font-medium">
                            {new Date(app.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Update:</span>
                          <span className="ml-2 font-medium">
                            {new Date(app.reviewed_at || app.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Status-specific information */}
                      {app.status === 'approved' && (
                        <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700 font-medium">
                            🎉 Application Approved! Please proceed with next steps.
                          </span>
                        </div>
                      )}
                      
                      {app.status === 'under_review' && (
                        <div className="flex items-center gap-2 mt-3 p-3 bg-teal-50 rounded-lg">
                          <Clock className="h-4 w-4 text-teal-500" />
                          <span className="text-sm text-teal-700">
                            Your application is currently under review. We'll notify you of any updates.
                          </span>
                        </div>
                      )}
                      
                      {app.additional_notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Your Notes:</span> {app.additional_notes}
                          </p>
                        </div>
                      )}
                      
                      {app.developer_notes && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Developer Notes:</span> {app.developer_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Application Details",
                          description: `Viewing details for ${app.projects?.name || 'project'}`,
                        })
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                    {app.status === 'approved' && (
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          toast({
                            title: "Next Steps",
                            description: "Please contact the developer to proceed with lease signing.",
                          })
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Next Steps
                      </Button>
                    )}
                    
                    {app.status === 'under_review' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Status Update",
                            description: "We'll notify you when there are updates to your application.",
                          })
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Check Status
                      </Button>
                    )}
                    
                    {app.status === 'submitted' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Application Submitted",
                            description: "Your application is waiting for review.",
                          })
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Pending Review
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/projects/${app.project_id}`)}
                    >
                      <Home className="h-4 w-4 mr-2" />
                      View Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}