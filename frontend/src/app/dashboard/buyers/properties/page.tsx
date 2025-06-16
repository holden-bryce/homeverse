import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Bed, Bath, Home, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default async function BuyerPropertiesPage() {
  const profile = await getUserProfile()
  if (!profile) {
    return null
  }

  const supabase = createClient()
  
  // Fetch available projects
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Available Properties</h1>
        <p className="text-gray-600 mt-1">Browse affordable housing opportunities</p>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {project.location || 'Location TBD'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Home className="h-4 w-4 mr-2" />
                    {project.total_units || 0} total units
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {project.available_units || 0} available units
                  </div>
                  {project.ami_percentage && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {project.ami_percentage}% AMI
                    </div>
                  )}
                </div>
                
                {project.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex gap-2">
                  <Link href={`/dashboard/buyers/properties/${project.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/dashboard/projects/${project.id}/apply`} className="flex-1">
                    <Button className="w-full bg-teal-600 hover:bg-teal-700">
                      Apply Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No properties available at this time</p>
            <p className="text-sm text-gray-400 mt-2">Check back soon for new listings</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}