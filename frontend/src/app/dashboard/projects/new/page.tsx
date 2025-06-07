'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Calendar,
  DollarSign,
  Users,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toast'

interface ProjectFormData {
  name: string
  developer: string
  location: string
  address: string
  latitude: number
  longitude: number
  total_units: number
  affordable_units: number
  ami_levels: string
  description: string
  completion_date: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    developer: '',
    location: '',
    address: '',
    latitude: 37.7749, // Default to SF
    longitude: -122.4194,
    total_units: 0,
    affordable_units: 0,
    ami_levels: '',
    description: '',
    completion_date: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.name) newErrors.name = 'Project name is required'
    if (!formData.developer) newErrors.developer = 'Developer name is required'
    if (!formData.address) newErrors.address = 'Address is required'
    if (formData.total_units <= 0) newErrors.total_units = 'Total units must be greater than 0'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0]
      
      if (!token) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'Please log in again to continue.',
        })
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({ 
          title: 'Success!',
          description: 'Project created successfully!',
          variant: 'success' 
        })
        router.push('/dashboard/projects')
      } else {
        throw new Error('Failed to create project')
      }
    } catch (error: any) {
      toast({ 
        title: 'Error',
        description: error.message || 'Failed to create project',
        variant: 'destructive' 
      })
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/projects">
              <Button variant="ghost" className="rounded-full p-2 hover:bg-sage-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
              <p className="text-gray-600 mt-1">
                Add a new affordable housing development project
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5 text-sage-600" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Essential details about the development project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className={`rounded-lg ${errors.name ? 'border-red-500' : 'border-sage-200'}`}
                    placeholder="e.g., Sunset Gardens"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <Label htmlFor="developer">Developer Name *</Label>
                  <Input
                    id="developer"
                    value={formData.developer}
                    onChange={(e) => updateFormData('developer', e.target.value)}
                    className={`rounded-lg ${errors.developer ? 'border-red-500' : 'border-sage-200'}`}
                    placeholder="e.g., Green Valley Development"
                  />
                  {errors.developer && <p className="text-red-500 text-sm mt-1">{errors.developer}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  className="rounded-lg border-sage-200"
                  placeholder="Describe the project goals, community impact, and unique features..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location & Address */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-sage-600" />
                Location
              </CardTitle>
              <CardDescription>
                Project location and address information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Full Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  className={`rounded-lg ${errors.address ? 'border-red-500' : 'border-sage-200'}`}
                  placeholder="e.g., 123 Main Street, San Francisco, CA 94102"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  className="rounded-lg border-sage-200"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => updateFormData('latitude', parseFloat(e.target.value) || 0)}
                    className="rounded-lg border-sage-200"
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
                    onChange={(e) => updateFormData('longitude', parseFloat(e.target.value) || 0)}
                    className="rounded-lg border-sage-200"
                    placeholder="-122.4194"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-sage-600" />
                Project Details
              </CardTitle>
              <CardDescription>
                Unit count, affordability, and timeline information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="total_units">Total Units *</Label>
                  <Input
                    id="total_units"
                    type="number"
                    min="1"
                    value={formData.total_units || ''}
                    onChange={(e) => updateFormData('total_units', parseInt(e.target.value) || 0)}
                    className={`rounded-lg ${errors.total_units ? 'border-red-500' : 'border-sage-200'}`}
                    placeholder="120"
                  />
                  {errors.total_units && <p className="text-red-500 text-sm mt-1">{errors.total_units}</p>}
                </div>
                
                <div>
                  <Label htmlFor="affordable_units">Affordable Units</Label>
                  <Input
                    id="affordable_units"
                    type="number"
                    min="0"
                    value={formData.affordable_units || ''}
                    onChange={(e) => updateFormData('affordable_units', parseInt(e.target.value) || 0)}
                    className="rounded-lg border-sage-200"
                    placeholder="96"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ami_levels">AMI Levels</Label>
                  <Input
                    id="ami_levels"
                    value={formData.ami_levels}
                    onChange={(e) => updateFormData('ami_levels', e.target.value)}
                    className="rounded-lg border-sage-200"
                    placeholder="30-80%"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="completion_date">Estimated Completion Date</Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) => updateFormData('completion_date', e.target.value)}
                  className="rounded-lg border-sage-200"
                />
              </div>
            </CardContent>
          </Card>


          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/projects">
              <Button 
                type="button" 
                variant="outline" 
                className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full px-8"
              >
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}