'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { 
  ArrowLeft,
  Save,
  AlertCircle
} from 'lucide-react'

interface Project {
  id: string
  name: string
  developer?: string
  developer_name?: string
  location?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  latitude?: number
  longitude?: number
  total_units?: number
  affordable_units?: number
  ami_levels?: string[]
  description?: string
  completion_date?: string
  estimated_delivery?: string
  status?: string
  created_at: string
  price_range?: string
  unit_types?: string[]
  amenities?: string[]
  transit_notes?: string
  school_district?: string
  contact_email?: string
  contact_phone?: string
  website?: string
}


export default function ProjectEditPage() {
  const router = useRouter()
  const { id } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    developer_name: '',
    total_units: '',
    affordable_units: '',
    ami_levels: [] as string[],
    unit_types: [] as string[],
    price_range: '',
    completion_date: '',
    latitude: '',
    longitude: '',
    status: 'planning',
    amenities: [] as string[],
    transit_notes: '',
    school_district: '',
    contact_email: '',
    contact_phone: '',
    website: '',
  })
  
  const [isSaving, setIsSaving] = useState(false)

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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/projects/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const projectData = await response.json()
          setProject(projectData)
          setFormData({
            name: projectData.name || '',
            description: projectData.description || '',
            address: projectData.address || '',
            city: projectData.city || '',
            state: projectData.state || 'CA',
            zip_code: projectData.zip_code || '',
            developer_name: projectData.developer_name || projectData.developer || '',
            total_units: projectData.total_units?.toString() || '',
            affordable_units: projectData.affordable_units?.toString() || '',
            ami_levels: projectData.ami_levels || [],
            unit_types: projectData.unit_types || [],
            price_range: projectData.price_range || '',
            completion_date: projectData.completion_date || projectData.estimated_delivery || '',
            latitude: projectData.latitude?.toString() || '',
            longitude: projectData.longitude?.toString() || '',
            status: projectData.status || 'planning',
            amenities: projectData.amenities || [],
            transit_notes: projectData.transit_notes || '',
            school_district: projectData.school_district || '',
            contact_email: projectData.contact_email || '',
            contact_phone: projectData.contact_phone || '',
            website: projectData.website || '',
          })
        } else {
          // Fallback to demo data
          const demoProjects = [
            {
              id: '1',
              name: 'Sunset Gardens',
              developer: 'Urban Housing LLC',
              location: 'San Francisco, CA',
              address: '123 Sunset Boulevard, San Francisco, CA 94102',
              latitude: 37.7749,
              longitude: -122.4194,
              description: 'Modern affordable housing in the heart of San Francisco with excellent transit access.',
              total_units: 120,
              affordable_units: 96,
              ami_levels: '30-80%',
              completion_date: '2024-12-15',
              created_at: '2024-01-15T10:00:00Z'
            },
            {
              id: '2',
              name: 'Riverside Commons',
              developer: 'Bay Area Developers',
              location: 'Oakland, CA',
              address: '456 River Street, Oakland, CA 94607',
              latitude: 37.8044,
              longitude: -122.2711,
              description: 'Family-friendly community near top-rated schools and public transportation.',
              total_units: 85,
              affordable_units: 68,
              ami_levels: '50-120%',
              completion_date: '2025-03-20',
              created_at: '2024-02-01T14:30:00Z'
            },
          ]
          
          const demoProject = demoProjects.find(proj => proj.id === id)
          if (demoProject) {
            setProject(demoProject)
            setFormData({
              name: demoProject.name,
              description: demoProject.description,
              address: demoProject.address,
              city: demoProject.location?.split(', ')[0] || '',
              state: demoProject.location?.split(', ')[1] || 'CA',
              zip_code: '',
              developer_name: demoProject.developer,
              total_units: demoProject.total_units.toString(),
              affordable_units: demoProject.affordable_units.toString(),
              ami_levels: demoProject.ami_levels ? [demoProject.ami_levels] : [],
              unit_types: [],
              price_range: '',
              completion_date: demoProject.completion_date,
              latitude: demoProject.latitude.toString(),
              longitude: demoProject.longitude.toString(),
              status: 'planning',
              amenities: [],
              transit_notes: '',
              school_district: '',
              contact_email: '',
              contact_phone: '',
              website: '',
            })
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

    if (id) {
      fetchProject()
    }
  }, [id, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50 flex items-center justify-center">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
            <p className="text-gray-500 mb-4">The project you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard/projects')} className="rounded-full">
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const requiredFields = ['name', 'total_units']
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData])
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    
    try {
      const token = localStorage.getItem('auth_token') || document.cookie.split('auth_token=')[1]?.split(';')[0]
      
      if (!token) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'Please log in again to continue.',
        })
        return
      }

      const updateData = {
        name: formData.name,
        developer_name: formData.developer_name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        total_units: formData.total_units ? parseInt(formData.total_units) : undefined,
        affordable_units: formData.affordable_units ? parseInt(formData.affordable_units) : undefined,
        ami_levels: formData.ami_levels,
        unit_types: formData.unit_types,
        price_range: formData.price_range,
        description: formData.description,
        estimated_delivery: formData.completion_date,
        status: formData.status,
        amenities: formData.amenities,
        transit_notes: formData.transit_notes,
        school_district: formData.school_district,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website: formData.website,
      }

      // Make PUT request to update the project
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        toast({
          title: "Project updated",
          description: `${formData.name} has been updated successfully.`,
        })
        
        // Redirect back to project view
        router.push(`/dashboard/projects/${id}`)
      } else {
        throw new Error('Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update project. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
            <p className="text-gray-600 mt-1">
              Update project information and settings
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the core details of your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="developer_name">Developer Name</Label>
                <Input
                  id="developer_name"
                  value={formData.developer_name}
                  onChange={(e) => handleInputChange('developer_name', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="mt-1"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="mt-1"
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="mt-1"
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    className="mt-1"
                    placeholder="94102"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    className="mt-1"
                    placeholder="37.7749"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    className="mt-1"
                    placeholder="-122.4194"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="total_units">Total Units *</Label>
                  <Input
                    id="total_units"
                    type="number"
                    value={formData.total_units}
                    onChange={(e) => handleInputChange('total_units', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="affordable_units">Affordable Units</Label>
                  <Input
                    id="affordable_units"
                    type="number"
                    value={formData.affordable_units}
                    onChange={(e) => handleInputChange('affordable_units', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ami_levels">AMI Levels</Label>
                  <Input
                    id="ami_levels"
                    value={formData.ami_levels}
                    onChange={(e) => handleInputChange('ami_levels', e.target.value)}
                    className="mt-1"
                    placeholder="30-80%"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>
                Pricing, amenities, and other information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_range">Price Range</Label>
                  <Input
                    id="price_range"
                    value={formData.price_range}
                    onChange={(e) => handleInputChange('price_range', e.target.value)}
                    className="mt-1"
                    placeholder="$1,200 - $2,800"
                  />
                </div>
                <div>
                  <Label htmlFor="completion_date">Estimated Completion</Label>
                  <Input
                    id="completion_date"
                    type="date"
                    value={formData.completion_date}
                    onChange={(e) => handleInputChange('completion_date', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="unit_types">Unit Types (comma-separated)</Label>
                <Input
                  id="unit_types"
                  value={Array.isArray(formData.unit_types) ? formData.unit_types.join(', ') : ''}
                  onChange={(e) => handleInputChange('unit_types', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                  className="mt-1"
                  placeholder="Studio, 1BR, 2BR, 3BR"
                />
              </div>

              <div>
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  value={Array.isArray(formData.amenities) ? formData.amenities.join(', ') : ''}
                  onChange={(e) => handleInputChange('amenities', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                  className="mt-1"
                  placeholder="Gym, Pool, Parking, Laundry"
                />
              </div>

              <div>
                <Label htmlFor="transit_notes">Transit & Transportation</Label>
                <Textarea
                  id="transit_notes"
                  value={formData.transit_notes}
                  onChange={(e) => handleInputChange('transit_notes', e.target.value)}
                  className="mt-1"
                  rows={2}
                  placeholder="Near BART station, bus lines 14 and 49..."
                />
              </div>

              <div>
                <Label htmlFor="school_district">School District</Label>
                <Input
                  id="school_district"
                  value={formData.school_district}
                  onChange={(e) => handleInputChange('school_district', e.target.value)}
                  className="mt-1"
                  placeholder="San Francisco Unified School District"
                />
              </div>

              <div>
                <Label htmlFor="status">Project Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500"
                >
                  <option value="planning">Planning</option>
                  <option value="approved">Approved</option>
                  <option value="construction">Under Construction</option>
                  <option value="active">Active/Accepting Applications</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How interested buyers can reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    className="mt-1"
                    placeholder="info@developer.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    className="mt-1"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="website">Project Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="mt-1"
                  placeholder="https://example.com"
                />
              </div>
            </CardContent>
          </Card>


          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}