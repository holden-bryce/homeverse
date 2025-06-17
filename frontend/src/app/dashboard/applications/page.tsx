'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { 
  FileText, 
  User, 
  Building2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Filter,
  Search,
  Loader2
} from 'lucide-react'
import { useApplications, useUpdateApplication } from '@/lib/supabase/hooks'
import { useAuth } from '@/providers/supabase-auth-provider'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
    full_name?: string
  }
}

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const { profile } = useAuth()
  
  const { data: applicationsData, isLoading, refetch } = useApplications({
    status: statusFilter || undefined
  })
  
  const updateApplication = useUpdateApplication()

  const applications = applicationsData?.data || []

  const handleStatusUpdate = async (applicationId: string, newStatus: string, notes?: string) => {
    try {
      await updateApplication.mutateAsync({
        applicationId,
        updateData: {
          status: newStatus,
          developer_notes: notes
        }
      })
      
      toast({
        title: 'Application Updated',
        description: `Application status updated to ${newStatus}.`,
        variant: 'success'
      })
      
      refetch()
    } catch (error) {
      console.error('Error updating application:', error)
      toast({
        title: 'Update Failed',
        description: 'Failed to update application status.',
        variant: 'destructive'
      })
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

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchTerm || 
      app.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicants?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
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

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
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
                          {application.applicants?.full_name || 
                           `${application.applicants?.first_name || ''} ${application.applicants?.last_name || ''}`.trim() ||
                           'Unknown Applicant'}
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

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    {application.status === 'submitted' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(application.id, 'under_review')}
                          disabled={updateApplication.isPending}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(application.id, 'approved', 'Application approved for housing placement.')}
                          disabled={updateApplication.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusUpdate(application.id, 'rejected', 'Application does not meet current requirements.')}
                          disabled={updateApplication.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {application.status === 'under_review' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(application.id, 'approved', 'Application approved after review.')}
                          disabled={updateApplication.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusUpdate(application.id, 'rejected', 'Application rejected after review.')}
                          disabled={updateApplication.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
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
              {searchTerm || statusFilter ? 'No applications match your filters' : 'No applications found'}
            </p>
            {(searchTerm || statusFilter) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}