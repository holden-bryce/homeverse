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
  Loader2,
  Trash2
} from 'lucide-react'
import { useDeleteProject } from '@/lib/api/hooks'
import { useConfirmationModal } from '@/components/ui/confirmation-modal'

interface ProjectDetailProps {
  params: {
    id: string
  }
}

interface Project {
  id: string
  name: string
  developer?: string
  location?: string
  latitude?: number
  longitude?: number
  total_units?: number
  affordable_units?: number
  ami_levels?: string
  status?: string
  address?: string
  description?: string
  completion_date?: string
  created_at: string
}

export default function ProjectDetailPage({ params }: ProjectDetailProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  
  const deleteProject = useDeleteProject()
  const { confirm, ConfirmationModal } = useConfirmationModal()

  const handleDeleteProject = () => {
    if (!project) return
    
    confirm({
      title: 'Delete Project',
      description: `Are you sure you want to delete "${project.name}"? This action cannot be undone and will permanently remove all project data including applications, analytics, and matching history.`,
      variant: 'danger',
      confirmText: 'Delete Project',
      onConfirm: async () => {
        try {
          await deleteProject.mutateAsync(project.id)
          toast({
            title: 'Project Deleted',
            description: `${project.name} has been successfully deleted.`,
            variant: 'success'
          })
          router.push('/dashboard/projects')
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to delete project. Please try again.',
            variant: 'destructive'
          })
          throw error // Re-throw to keep modal open on error
        }
      }
    })
  }

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('auth_token') || document.cookie.split('auth_token=')[1]?.split(';')[0]
        
        if (!token) {
          toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'Please log in again to continue.',
          })
          router.push('/auth/login')
          return
        }

        // First try to get specific project from API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/projects/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const project = await response.json()
          setProject(project)
        } else {
          // Fallback to demo data
          const demoProjects = [
            {
              id: '1',
              name: 'Sunset Gardens',
              developer: 'Green Valley Development',
              location: 'San Francisco, CA',
              latitude: 37.7749,
              longitude: -122.4194,
              total_units: 120,
              affordable_units: 96,
              ami_levels: '30-80%',
              completion_date: '2024-12-15',
              status: 'active',
              address: '123 Sunset Boulevard, San Francisco, CA 94102',
              created_at: '2024-01-15T10:00:00Z',
              description: 'A sustainable affordable housing development featuring 120 units with modern amenities and green building certifications. Located in the heart of San Francisco with easy access to public transportation.',
            },
            {
              id: '2',
              name: 'Riverside Commons',
              developer: 'Urban Housing Partners',
              location: 'Oakland, CA',
              latitude: 37.7849,
              longitude: -122.4094,
              total_units: 85,
              affordable_units: 68,
              ami_levels: '50-120%',
              completion_date: '2025-03-20',
              status: 'construction',
              address: '456 River Street, Oakland, CA 94607',
              created_at: '2024-02-01T14:30:00Z',
              description: 'Contemporary mixed-income housing development with community amenities including a fitness center, community garden, and childcare facilities.',
            },
            {
              id: '3',
              name: 'Harbor View Apartments',
              developer: 'Coastal Development LLC',
              location: 'San Jose, CA',
              latitude: 37.7649,
              longitude: -122.4294,
              total_units: 200,
              affordable_units: 160,
              ami_levels: '30-60%',
              status: 'planning',
              address: '789 Harbor Street, San Jose, CA 95113',
              created_at: '2024-02-10T09:15:00Z',
              description: 'Large-scale affordable housing development planned for families and seniors, featuring universal design principles and on-site supportive services.',
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

  const getAffordabilityRate = () => {
    if (project?.total_units && project?.affordable_units) {
      return Math.round((project.affordable_units / project.total_units) * 100)
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

  const affordabilityRate = getAffordabilityRate()

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
              <p className="text-gray-600 mt-1">{project.developer}</p>
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
            <Button
              variant="outline"
              onClick={handleDeleteProject}
              className="border-red-500 text-red-600 hover:bg-red-50"
              disabled={deleteProject.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
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
                    {getStatusIcon(project.status || 'active')}
                    <Badge className={`${getStatusColor(project.status || 'active')} rounded-full border capitalize`}>
                      {project.status || 'active'}
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
                  <p className="text-2xl font-bold text-gray-900 mt-1">{project.total_units}</p>
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
                  <p className="text-sm font-medium text-gray-600">Affordable Units</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {project.affordable_units || 'N/A'}
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
                  <p className="text-sm font-medium text-gray-600">AMI Levels</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {project.ami_levels || 'N/A'}
                  </p>
                  {affordabilityRate !== null && (
                    <p className="text-sm text-gray-500">{affordabilityRate}% affordable</p>
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
                  <p className="text-gray-900">{project.developer || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Units</p>
                  <p className="text-gray-900">{project.total_units || 'Not specified'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Location</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">
                    {project.address || project.location || 
                      (project.latitude && project.longitude ? 
                        `${project.latitude.toFixed(4)}, ${project.longitude.toFixed(4)}` : 
                        'Not specified')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">AMI Levels</p>
                <Badge className="bg-cream-100 text-cream-800 border border-cream-200 rounded-full">
                  {project.ami_levels || 'Not specified'}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Completion Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">
                    {project.completion_date ? 
                      new Date(project.completion_date).toLocaleDateString() : 
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
                <p className="text-sm font-medium text-gray-600 mb-2">Affordable Units</p>
                <p className="text-gray-900 leading-relaxed">
                  {project.affordable_units ? 
                    `${project.affordable_units} out of ${project.total_units} units (${affordabilityRate}%)` : 
                    'No affordable units specified.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
      {ConfirmationModal}
    </div>
  )
}