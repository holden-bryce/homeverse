import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
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
  Trash2,
  FileText
} from 'lucide-react'
import { ProjectImages } from '@/components/projects/project-images'
import { deleteProject, uploadProjectImage, deleteProjectImage } from '../actions'

interface ProjectDetailPageProps {
  params: {
    id: string
  }
}

async function getProject(id: string) {
  const supabase = createClient()
  
  const { data: project, error } = await supabase
    .from('projects')
    .select('*, companies(name)')
    .eq('id', id)
    .single()
    
  if (error || !project) {
    return null
  }
  
  return project
}

function ProjectActions({ project, profile }: { project: any, profile: any }) {
  const canEdit = profile?.role && ['developer', 'admin'].includes(profile.role) && 
                  profile.company_id === project.company_id

  if (!canEdit) return null

  return (
    <>
      <Button
        variant="outline"
        className="border-sage-200 text-sage-700 hover:bg-sage-50"
        asChild
      >
        <Link href={`/dashboard/projects/${project.id}/edit`}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Link>
      </Button>
      
      <form action={async () => {
        'use server'
        await deleteProject(project.id)
      }}>
        <Button
          type="submit"
          variant="outline"
          className="border-red-200 text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </form>
    </>
  )
}

function ProjectDetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
        <div className="h-6 w-48 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  // In Next.js 15, params might be a Promise
  const resolvedParams = await Promise.resolve(params)
  
  const [project, profile] = await Promise.all([
    getProject(resolvedParams.id),
    getUserProfile()
  ])
  
  if (!project) {
    notFound()
  }

  const canEdit = profile?.role && ['developer', 'admin'].includes(profile.role) && 
                  profile.company_id === project.company_id

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

  const affordabilityRate = project.total_units && project.affordable_units
    ? Math.round((project.affordable_units / project.total_units) * 100)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/projects">
              <Button
                variant="outline"
                size="sm"
                className="border-sage-200 text-sage-700 hover:bg-sage-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-1">{project.companies?.name}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <ProjectActions project={project} profile={profile} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Project Overview</CardTitle>
                  <Badge className={`${getStatusColor(project.status || 'planning')} rounded-full px-3`}>
                    <span className="mr-1.5">{getStatusIcon(project.status || 'planning')}</span>
                    {project.status || 'Planning'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-1">Description</h3>
                    <p className="text-gray-900">{project.description}</p>
                  </div>
                )}
                
                {project.price_range && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-1">Price Range</h3>
                    <p className="text-gray-900">{project.price_range}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-1">Location</h3>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-sage-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-gray-900">{project.address}</p>
                        <p className="text-gray-600 text-sm">
                          {project.city}, {project.state} {project.zip_code}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-1">Unit Information</h3>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-sage-600" />
                        <span className="text-gray-900">{project.total_units} total units</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-sage-600" />
                        <span className="text-gray-900">{project.affordable_units} affordable units</span>
                      </div>
                    </div>
                  </div>
                </div>

                {project.ami_levels && project.ami_levels.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-2">AMI Levels</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.ami_levels.map((level: string) => (
                        <Badge key={level} variant="secondary" className="bg-sage-100 text-sage-800 rounded-full">
                          {level} AMI
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {project.unit_types && project.unit_types.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-2">Unit Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.unit_types.map((type: string) => (
                        <Badge key={type} variant="secondary" className="bg-cream-100 text-cream-800 rounded-full">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {project.amenities && project.amenities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-2">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.amenities.map((amenity: string) => (
                        <Badge key={amenity} variant="outline" className="rounded-full">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {project.transit_notes && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-1">Transit & Transportation</h3>
                    <p className="text-gray-900">{project.transit_notes}</p>
                  </div>
                )}
                
                {project.school_district && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-1">School District</h3>
                    <p className="text-gray-900">{project.school_district}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Images Section */}
            <ProjectImages 
              projectId={project.id} 
              images={Array.isArray(project.images) ? project.images : []} 
              canEdit={canEdit}
              uploadAction={uploadProjectImage}
              deleteAction={deleteProjectImage}
            />
            
            {/* Contact Information */}
            {(project.contact_email || project.contact_phone || project.website) && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.contact_email && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Email:</span>
                      <a href={`mailto:${project.contact_email}`} className="text-sage-600 hover:underline">
                        {project.contact_email}
                      </a>
                    </div>
                  )}
                  {project.contact_phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <a href={`tel:${project.contact_phone}`} className="text-sage-600 hover:underline">
                        {project.contact_phone}
                      </a>
                    </div>
                  )}
                  {project.website && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Website:</span>
                      <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-sage-600 hover:underline">
                        {project.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics Card */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-sage-600" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {affordabilityRate !== null && (
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm text-gray-600">Affordability Rate</span>
                      <span className="text-2xl font-bold text-sage-600">{affordabilityRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-sage-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${affordabilityRate}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Units</span>
                    <span className="font-semibold">{project.total_units}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Affordable Units</span>
                    <span className="font-semibold">{project.affordable_units}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Market Rate Units</span>
                    <span className="font-semibold">
                      {(project.total_units || 0) - (project.affordable_units || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Apply button for buyers/applicants */}
                {profile && !canEdit && (
                  <Link href={`/dashboard/buyers/apply/${project.id}`} className="block">
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                      <FileText className="h-4 w-4 mr-2" />
                      Apply Now
                    </Button>
                  </Link>
                )}
                
                {/* View Applications for developers */}
                {canEdit && (
                  <Link href={`/dashboard/applications?project_id=${project.id}`} className="block">
                    <Button variant="outline" className="w-full">
                      View Applications
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}