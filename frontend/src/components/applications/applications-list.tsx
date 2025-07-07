'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  User, 
  Building2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  Loader2
} from 'lucide-react'
import { updateApplicationStatus } from '@/app/dashboard/applications/actions'
import { useRouter } from 'next/navigation'

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
  }
  applicants?: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
  }
}

interface ApplicationsListProps {
  initialApplications: Application[]
  userRole?: string
}

export function ApplicationsList({ initialApplications, userRole }: ApplicationsListProps) {
  const [applications] = useState(initialApplications)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  const handleStatusUpdate = async (applicationId: string, newStatus: string, notes?: string) => {
    if (newStatus === 'approved' || newStatus === 'rejected') {
      const action = newStatus === 'approved' ? 'approve' : 'reject'
      const confirmed = window.confirm(`Are you sure you want to ${action} this application? This action cannot be undone.`)
      if (!confirmed) return
    }
    
    try {
      setUpdating(applicationId)
      await updateApplicationStatus(applicationId, newStatus, notes)
      
      const statusMessages: Record<string, string> = {
        'approved': '✅ Application approved successfully!',
        'rejected': '❌ Application rejected.',
        'under_review': '👀 Application marked for review.',
        'submitted': '📝 Application status reset to submitted.'
      }
      
      toast({
        title: 'Application Updated',
        description: statusMessages[newStatus] || `Application status updated to ${newStatus}.`,
        variant: newStatus === 'approved' ? 'default' : 'default'
      })
      
      // Force a hard refresh to ensure UI updates
      setTimeout(() => {
        router.refresh()
        window.location.reload()
      }, 500)
    } catch (error: any) {
      console.error('Error updating application:', error)
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update application status.',
        variant: 'destructive'
      })
    } finally {
      setUpdating(null)
    }
  }

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

  const filteredApplications = applications.filter((app: Application) => {
    const applicantName = app.applicants ? 
      `${app.applicants.first_name || ''} ${app.applicants.last_name || ''}`.trim() : ''
    
    const matchesSearch = !searchTerm || 
      app.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicantName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const canUpdateStatus = userRole === 'developer' || userRole === 'admin'

  return (
    <>
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application: Application) => (
            <Card key={application.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="h-5 w-5 text-teal-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.projects?.name || 'Unknown Project'}
                      </h3>
                      <Badge className={`${getStatusColor(application.status)} border rounded-full`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(application.status)}
                          {application.status.replace('_', ' ')}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          {application.applicants ? 
                           `${application.applicants.first_name || ''} ${application.applicants.last_name || ''}`.trim() ||
                           'Unknown Applicant' : 'Unknown Applicant'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Submitted: {new Date(application.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {application.preferred_move_in_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Move-in: {new Date(application.preferred_move_in_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {application.additional_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Notes:</span> {application.additional_notes}
                        </p>
                      </div>
                    )}

                    {application.developer_notes && (
                      <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <p className="text-sm text-teal-700">
                          <span className="font-medium">Developer Notes:</span> {application.developer_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {canUpdateStatus && (
                    <div className="flex gap-2 ml-4">
                      {application.status === 'submitted' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(application.id, 'under_review')}
                            disabled={updating === application.id}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(application.id, 'approved', 'Application approved for housing placement.')}
                            disabled={updating === application.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {updating === application.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(application.id, 'rejected', 'Application does not meet current requirements.')}
                            disabled={updating === application.id}
                          >
                            {updating === application.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-1" />
                            )}
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {application.status === 'under_review' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(application.id, 'approved', 'Application approved after review.')}
                            disabled={updating === application.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {updating === application.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(application.id, 'rejected', 'Application rejected after review.')}
                            disabled={updating === application.id}
                          >
                            {updating === application.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-1" />
                            )}
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' ? 'No applications match your filters' : 'No applications have been submitted yet'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <p className="text-sm text-gray-400 mb-4">
                Applications will appear here when applicants submit them for housing projects.
              </p>
            )}
            {(searchTerm || statusFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}