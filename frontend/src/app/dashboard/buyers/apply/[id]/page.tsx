import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Users,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { ApplicationForm } from './application-form'

interface ApplicationPageProps {
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

export default async function ApplicationPage({ params }: ApplicationPageProps) {
  // In Next.js 15, params might be a Promise
  const resolvedParams = await Promise.resolve(params)
  
  const [project, profile] = await Promise.all([
    getProject(resolvedParams.id),
    getUserProfile()
  ])
  
  if (!project) {
    notFound()
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to apply for this property.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/projects/${project.id}`} className="group">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full hover:bg-sage-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Project
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Apply for {project.name}</h1>
            <p className="text-gray-600 mt-1">
              Submit your application for affordable housing
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Form */}
          <div className="lg:col-span-2">
            <ApplicationForm 
              projectId={project.id}
              projectName={project.name}
              userProfile={profile}
            />
          </div>

          {/* Property Summary */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5 text-sage-600" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>{project.address}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Units</span>
                    <span className="font-medium">{project.total_units || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Affordable Units</span>
                    <span className="font-medium text-sage-600">
                      {project.affordable_units || 'N/A'}
                    </span>
                  </div>
                  {project.ami_levels && project.ami_levels.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">AMI Levels</span>
                      <span className="font-medium">{project.ami_levels.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">Developer</p>
                  <p className="font-medium">{project.companies?.name || 'N/A'}</p>
                </div>

                {project.completion_date && (
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-sage-600" />
                    <span>Expected: {new Date(project.completion_date).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Tips */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-sage-50">
              <CardHeader>
                <CardTitle className="text-lg">Application Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5"></div>
                  <p className="text-sm text-gray-700">
                    Ensure all information is accurate and complete
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5"></div>
                  <p className="text-sm text-gray-700">
                    Have your income documentation ready for verification
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5"></div>
                  <p className="text-sm text-gray-700">
                    Applications are processed in the order received
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}