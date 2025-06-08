'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Calendar,
  DollarSign,
  Users,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  TrendingUp,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toast'
import { useDeleteProject } from '@/lib/api/hooks'
import { useConfirmationModal } from '@/components/ui/confirmation-modal'

// Type for projects that handles both old and new field names
interface Project {
  id: string
  name: string
  developer_name?: string
  developer?: string
  location?: [number, number] | string
  unit_count?: number
  total_units?: number
  ami_min?: number
  ami_max?: number
  affordable_units?: number
  ami_levels?: string
  est_delivery?: string
  completion_date?: string
  status: string
  address?: string
  total_investment?: number
  units_leased?: number
  created_at: string
}

const stats = [
  {
    title: 'Active Projects',
    value: '156',
    change: '+8.2%',
    icon: Building2,
  },
  {
    title: 'Total Units',
    value: '12,847',
    change: '+15.3%',
    icon: Users,
  },
  {
    title: 'Units Leased',
    value: '8,234',
    change: '+22.1%',
    icon: TrendingUp,
  },
  {
    title: 'Total Investment',
    value: '$2.4B',
    change: '+12.5%',
    icon: DollarSign,
  },
]

export default function ProjectsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [developerFilter, setDeveloperFilter] = useState('all')
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const deleteProject = useDeleteProject()
  const { confirm, ConfirmationModal } = useConfirmationModal()

  const handleDeleteProject = (projectId: string, projectName: string) => {
    confirm({
      title: 'Delete Project',
      description: `Are you sure you want to delete "${projectName}"? This action cannot be undone and will permanently remove all project data including applications and analytics.`,
      variant: 'danger',
      confirmText: 'Delete Project',
      onConfirm: async () => {
        try {
          await deleteProject.mutateAsync(projectId)
          toast({
            title: 'Project Deleted',
            description: `${projectName} has been successfully deleted.`,
            variant: 'success'
          })
          // Refresh the data
          fetchProjects()
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
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load projects.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.developer_name || project.developer || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesDeveloper = developerFilter === 'all' || project.developer_name === developerFilter || project.developer === developerFilter
    
    return matchesSearch && matchesStatus && matchesDeveloper
  })

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

  const getOccupancyRate = (project: any) => {
    if (project.status === 'active' && project.units_leased !== undefined) {
      return Math.round((project.units_leased / project.unit_count) * 100)
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">
              Manage housing development projects and track progress
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full"
              onClick={() => {
                const csvContent = `Project Name,Developer,Location,Total Units,AMI Range,Status\n${filteredProjects.map(p => `"${p.name}","${p.developer_name || p.developer || ''}","${p.address || p.location || ''}",${p.unit_count || p.total_units || 0},"${p.ami_min || 0}-${p.ami_max || 0}%","${p.status}"`).join('\n')}`
                const blob = new Blob([csvContent], { type: 'text/csv' })
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `homeverse-projects-${new Date().toISOString().split('T')[0]}.csv`
                a.click()
                window.URL.revokeObjectURL(url)
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Link href="/dashboard/projects/new">
              <Button className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-6">
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className="text-sm text-sage-600 mt-1">{stat.change} from last month</p>
                    </div>
                    <div className="h-12 w-12 bg-sage-100 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-sage-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Projects Table */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Project Portfolio</CardTitle>
            <CardDescription>
              Overview of all housing development projects
            </CardDescription>
          </CardHeader>
          <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search projects or developers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-sage-200 focus:border-sage-400 rounded-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-full border-sage-200">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={developerFilter} onValueChange={setDeveloperFilter}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-full border-sage-200">
                <SelectValue placeholder="Filter by developer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Developers</SelectItem>
                <SelectItem value="Green Valley Development">Green Valley Development</SelectItem>
                <SelectItem value="Urban Housing Partners">Urban Housing Partners</SelectItem>
                <SelectItem value="Coastal Development LLC">Coastal Development LLC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-sage-100 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-sage-50/50">
                  <TableHead className="font-semibold text-gray-700 min-w-[200px]">Project</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden md:table-cell">Developer</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden lg:table-cell">Location</TableHead>
                  <TableHead className="font-semibold text-gray-700 min-w-[80px]">Units</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden sm:table-cell min-w-[120px]">AMI Range</TableHead>
                  <TableHead className="font-semibold text-gray-700 min-w-[100px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden xl:table-cell">Delivery</TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden xl:table-cell">Occupancy</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700 min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const occupancyRate = getOccupancyRate(project)
                  return (
                    <TableRow key={project.id} className="hover:bg-sage-50/50 transition-colors">
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-gray-500">
                            {project.total_investment && 
                              `$${(project.total_investment / 1000000).toFixed(1)}M investment`
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">{project.developer_name}</div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          {project.address || (Array.isArray(project.location) ? `${project.location[0].toFixed(2)}, ${project.location[1].toFixed(2)}` : project.location || 'Location TBD')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-1" />
                          {project.unit_count || project.total_units || 0}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className="bg-cream-100 text-cream-800 border border-cream-200 rounded-full">
                          {project.ami_min}%-{project.ami_max}% AMI
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(project.status)} rounded-full border capitalize`}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {project.est_delivery ? 
                            new Date(project.est_delivery).toLocaleDateString() : 
                            'TBD'
                          }
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {occupancyRate !== null ? (
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-sage-500 h-2 rounded-full" 
                                style={{ width: `${occupancyRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{occupancyRate}%</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-full h-8 w-8 p-0 hover:bg-sage-100" 
                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                            aria-label={`View details for ${project.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-full h-8 w-8 p-0 hover:bg-sage-100" 
                            onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
                            aria-label={`Edit ${project.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-full h-8 w-8 p-0 hover:bg-red-100"
                            onClick={() => handleDeleteProject(project.id, project.name)}
                            disabled={deleteProject.isPending}
                            aria-label={`Delete ${project.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-full h-8 w-8 p-0 hover:bg-sage-100"
                            onClick={() => {
                              const actions = [
                                { label: 'Duplicate Project', action: () => console.log('Duplicate project:', project.id) },
                                { label: 'Archive Project', action: () => console.log('Archive project:', project.id) },
                                { label: 'Export Details', action: () => console.log('Export project:', project.id) }
                              ]
                              // For now, show first available action
                              if (actions.length > 0) actions[0].action()
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 bg-sage-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-12 w-12 text-sage-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || developerFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first project.'}
              </p>
              {(!searchTerm && statusFilter === 'all' && developerFilter === 'all') && (
                <Link href="/dashboard/projects/new">
                  <Button className="mt-4 bg-sage-600 hover:bg-sage-700 text-white rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Project
                  </Button>
                </Link>
              )}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
      {ConfirmationModal}
    </div>
  )
}