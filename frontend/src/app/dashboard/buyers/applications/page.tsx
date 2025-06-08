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
  Home
} from 'lucide-react'

// Mock applications data
const mockApplications = [
  {
    id: '1',
    propertyName: 'Sunset Gardens',
    location: 'San Francisco, CA',
    status: 'under_review',
    submittedDate: '2024-01-10',
    lastUpdate: '2024-01-12',
    position: 15,
    totalApplicants: 150,
    monthlyRent: 1800,
    applicationId: 'SG-2024-001',
  },
  {
    id: '2',
    propertyName: 'Mission Bay Towers',
    location: 'San Francisco, CA',
    status: 'approved',
    submittedDate: '2023-12-28',
    lastUpdate: '2024-01-05',
    offerExpires: '2024-01-20',
    monthlyRent: 1650,
    applicationId: 'MB-2024-002',
  },
  {
    id: '3',
    propertyName: 'Harbor View Apartments',
    location: 'San Jose, CA',
    status: 'waitlisted',
    submittedDate: '2023-12-15',
    lastUpdate: '2023-12-20',
    position: 45,
    totalApplicants: 200,
    monthlyRent: 2500,
    applicationId: 'HV-2023-003',
  },
]

export default function ApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState(mockApplications)

  useEffect(() => {
    // Load applications from localStorage
    const savedApplications = JSON.parse(localStorage.getItem('applications') || '[]')
    if (savedApplications.length > 0) {
      // Combine saved applications with mock data
      setApplications([...savedApplications, ...mockApplications])
    }
  }, [])

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'under_review':
        return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'waitlisted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
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
      case 'waitlisted':
        return <Clock className="h-4 w-4" />
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
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
            applications.map(app => (
              <Card key={app.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{app.propertyName}</h3>
                        <Badge className={`${getApplicationStatusColor(app.status)} border rounded-full`}>
                          {getApplicationStatusIcon(app.status)}
                          <span className="ml-1 capitalize">{app.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{app.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${app.monthlyRent}/mo</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>ID: {app.applicationId}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Submitted:</span>
                          <span className="ml-2 font-medium">
                            {new Date(app.submittedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Update:</span>
                          <span className="ml-2 font-medium">
                            {new Date(app.lastUpdate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Status-specific information */}
                      {app.position && (
                        <div className="flex items-center gap-2 mt-3 p-3 bg-teal-50 rounded-lg">
                          <Clock className="h-4 w-4 text-teal-500" />
                          <span className="text-sm text-teal-700">
                            Position #{app.position} {app.totalApplicants && `of ${app.totalApplicants} applicants`}
                          </span>
                        </div>
                      )}
                      
                      {app.offerExpires && (
                        <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700 font-medium">
                            🎉 Approved! Offer expires: {new Date(app.offerExpires).toLocaleDateString()}
                          </span>
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
                          description: `Viewing details for ${app.propertyName}`,
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
                            title: "Accept Offer",
                            description: "Redirecting to lease signing...",
                          })
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Offer
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
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/buyers/properties/${app.id}`)}
                    >
                      <Home className="h-4 w-4 mr-2" />
                      View Property
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