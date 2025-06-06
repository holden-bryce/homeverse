'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Building2, 
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface ProjectDetailProps {
  params: {
    id: string
  }
}

interface Project {
  id: string
  name: string
  developer_name: string
  location: [number, number]
  unit_count: number
  ami_min: number
  ami_max: number
  est_delivery?: string
  status: string
  address?: string
  total_investment?: number
  units_leased?: number
  created_at: string
  description?: string
  project_type?: string
  affordability_requirements?: string
  contact_email?: string
  contact_phone?: string
}

export default function ProjectDetailPage({ params }: ProjectDetailProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
        
        if (!token) {
          toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'Please log in again to continue.',
          })
          router.push('/auth/login')
          return
        }

        // First try to get from real API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const projects = await response.json()
          const foundProject = projects.find((proj: any) => proj.id === params.id)
          
          if (foundProject) {
            setProject(foundProject)
          } else {
            // Fallback to demo data
            const demoProjects = [
              {
                id: '1',
                name: 'Sunset Gardens',
                developer_name: 'Green Valley Development',
                location: [37.7749, -122.4194] as [number, number],
                unit_count: 120,
                ami_min: 30,
                ami_max: 80,
                est_delivery: '2024-12-15',
                status: 'active',
                address: 'San Francisco, CA',
                total_investment: 25000000,
                units_leased: 45,
                created_at: '2024-01-15T10:00:00Z',
                description: 'A sustainable affordable housing development featuring 120 units with modern amenities and green building certifications. Located in the heart of San Francisco with easy access to public transportation.',
                project_type: 'New Construction',
                affordability_requirements: '30% of units for 30% AMI, 40% of units for 50% AMI, 30% of units for 80% AMI',
                contact_email: 'info@greenvalley.com',
                contact_phone: '(415) 555-0123'
              },
              {
                id: '2',
                name: 'Riverside Commons',
                developer_name: 'Urban Housing Partners',
                location: [37.7849, -122.4094] as [number, number],
                unit_count: 85,
                ami_min: 50,
                ami_max: 120,
                est_delivery: '2025-03-20',
                status: 'construction',
                address: 'Oakland, CA',
                total_investment: 18500000,
                units_leased: 0,
                created_at: '2024-02-01T14:30:00Z',
                description: 'Contemporary mixed-income housing development with community amenities including a fitness center, community garden, and childcare facilities.',
                project_type: 'Mixed-Income Development',
                affordability_requirements: '40% of units for 50% AMI, 60% of units for 80-120% AMI',
                contact_email: 'development@urbanhousing.com',
                contact_phone: '(510) 555-0456'
              },
              {
                id: '3',
                name: 'Harbor View Apartments',
                developer_name: 'Coastal Development LLC',
                location: [37.7649, -122.4294] as [number, number],
                unit_count: 200,
                ami_min: 30,
                ami_max: 60,
                status: 'planning',
                address: 'San Jose, CA',
                total_investment: 42000000,
                units_leased: 0,
                created_at: '2024-02-10T09:15:00Z',
                description: 'Large-scale affordable housing development planned for families and seniors, featuring universal design principles and on-site supportive services.',
                project_type: 'Affordable Housing',
                affordability_requirements: '50% of units for 30% AMI, 50% of units for 60% AMI',
                contact_email: 'projects@coastaldev.com',
                contact_phone: '(408) 555-0789'
              }
            ]
            
            const demoProject = demoProjects.find(proj => proj.id === params.id)
            if (demoProject) {
              setProject(demoProject)
            } else {
              toast({
                variant: 'destructive',
                title: 'Not Found',
                description: 'Project not found.',
              })
              router.push('/dashboard/projects')
              return
            }
          }
        }
      } catch (error) {
        console.error('Error fetching project:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load project details.',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [params.id, router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-sage-100 text-sage-800 border-sage-200'
      case 'construction':
        return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'planning':
        return 'bg-cream-100 text-cream-800 border-cream-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-sage-600" />
      case 'construction':
        return <Clock className="h-4 w-4 text-teal-600" />
      case 'planning':
        return <Target className="h-4 w-4 text-cream-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getOccupancyRate = () => {
    if (project?.status === 'active' && project?.units_leased !== undefined) {
      return Math.round((project.units_leased / project.unit_count) * 100)
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <p>Project not found</p>
      </div>
    )
  }

  const occupancyRate = getOccupancyRate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-sage-200 text-sage-700 hover:bg-sage-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-1">{project.developer_name}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
              className="border-sage-200 text-sage-700 hover:bg-sage-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
          </div>
        </div>

        {/* Status and Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusIcon(project.status)}
                    <Badge className={`${getStatusColor(project.status)} rounded-full border capitalize`}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Units</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{project.unit_count}</p>
                </div>
                <div className="h-12 w-12 bg-sage-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-sage-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Investment</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {project.total_investment ? `$${(project.total_investment / 1000000).toFixed(1)}M` : 'N/A'}
                  </p>
                </div>
                <div className="h-12 w-12 bg-sage-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-sage-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Occupancy</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {occupancyRate !== null ? `${occupancyRate}%` : 'N/A'}
                  </p>
                  {project.units_leased !== undefined && (
                    <p className="text-sm text-gray-500">{project.units_leased} / {project.unit_count} units</p>
                  )}
                </div>
                <div className="h-12 w-12 bg-sage-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-sage-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Details */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Basic project details and specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Developer</p>
                  <p className="text-gray-900">{project.developer_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Project Type</p>
                  <p className="text-gray-900">{project.project_type || 'Not specified'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Location</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">
                    {project.address || `${project.location[0].toFixed(4)}, ${project.location[1].toFixed(4)}`}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">AMI Range</p>
                <Badge className="bg-cream-100 text-cream-800 border border-cream-200 rounded-full">
                  {project.ami_min}%-{project.ami_max}% AMI
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Estimated Delivery</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">
                    {project.est_delivery ? 
                      new Date(project.est_delivery).toLocaleDateString() : 
                      'TBD'
                    }
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-gray-900">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Description & Requirements */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Description & Requirements</CardTitle>
              <CardDescription>Project overview and affordability details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Project Description</p>
                <p className="text-gray-900 leading-relaxed">
                  {project.description || 'No description available.'}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Affordability Requirements</p>
                <p className="text-gray-900 leading-relaxed">
                  {project.affordability_requirements || 'No specific requirements listed.'}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Contact Information</p>
                <div className="space-y-2">
                  {project.contact_email && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-gray-900">{project.contact_email}</p>
                    </div>
                  )}
                  {project.contact_phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-gray-900">{project.contact_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Occupancy Progress (only for active projects) */}
        {project.status === 'active' && occupancyRate !== null && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Occupancy Progress</CardTitle>
              <CardDescription>Current leasing status and unit availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Units Leased</span>
                  <span className="text-sm font-medium text-gray-900">
                    {project.units_leased} / {project.unit_count} ({occupancyRate}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-sage-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Available: {project.unit_count - (project.units_leased || 0)} units</span>
                  <span>Target: 100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}