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
import { useCreateProject } from '@/lib/api/hooks'
import { toast } from '@/components/ui/toast'

interface ProjectFormData {
  name: string
  developer_name: string
  location: [number, number]
  unit_count: number
  ami_min: number
  ami_max: number
  est_delivery: string
  metadata_json: {
    description: string
    address: string
    total_investment: number
    target_demographics: string[]
    amenities: string[]
    contact_email: string
    contact_phone: string
  }
}

export default function NewProjectPage() {
  const router = useRouter()
  const createProject = useCreateProject()
  
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    developer_name: '',
    location: [37.7749, -122.4194], // Default to SF
    unit_count: 0,
    ami_min: 30,
    ami_max: 80,
    est_delivery: '',
    metadata_json: {
      description: '',
      address: '',
      total_investment: 0,
      target_demographics: [],
      amenities: [],
      contact_email: '',
      contact_phone: ''
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.name) newErrors.name = 'Project name is required'
    if (!formData.developer_name) newErrors.developer_name = 'Developer name is required'
    if (!formData.metadata_json.address) newErrors.address = 'Address is required'
    if (formData.unit_count <= 0) newErrors.unit_count = 'Unit count must be greater than 0'
    if (formData.ami_min < 0 || formData.ami_min > 200) newErrors.ami_min = 'AMI min must be between 0-200%'
    if (formData.ami_max < 0 || formData.ami_max > 200) newErrors.ami_max = 'AMI max must be between 0-200%'
    if (formData.ami_min >= formData.ami_max) newErrors.ami_max = 'AMI max must be greater than AMI min'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      await createProject.mutateAsync(formData)
      toast({ 
        title: 'Success!',
        description: 'Project created successfully!',
        variant: 'success' 
      })
      router.push('/dashboard/projects')
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
    if (field.startsWith('metadata_json.')) {
      const metadataField = field.replace('metadata_json.', '')
      setFormData(prev => ({
        ...prev,
        metadata_json: {
          ...prev.metadata_json,
          [metadataField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
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
                  <Label htmlFor="developer_name">Developer Name *</Label>
                  <Input
                    id="developer_name"
                    value={formData.developer_name}
                    onChange={(e) => updateFormData('developer_name', e.target.value)}
                    className={`rounded-lg ${errors.developer_name ? 'border-red-500' : 'border-sage-200'}`}
                    placeholder="e.g., Green Valley Development"
                  />
                  {errors.developer_name && <p className="text-red-500 text-sm mt-1">{errors.developer_name}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  value={formData.metadata_json.description}
                  onChange={(e) => updateFormData('metadata_json.description', e.target.value)}
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
                  value={formData.metadata_json.address}
                  onChange={(e) => updateFormData('metadata_json.address', e.target.value)}
                  className={`rounded-lg ${errors.address ? 'border-red-500' : 'border-sage-200'}`}
                  placeholder="e.g., 123 Main Street, San Francisco, CA 94102"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.location[0]}
                    onChange={(e) => updateFormData('location', [parseFloat(e.target.value) || 0, formData.location[1]])}
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
                    value={formData.location[1]}
                    onChange={(e) => updateFormData('location', [formData.location[0], parseFloat(e.target.value) || 0])}
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
                  <Label htmlFor="unit_count">Total Units *</Label>
                  <Input
                    id="unit_count"
                    type="number"
                    min="1"
                    value={formData.unit_count || ''}
                    onChange={(e) => updateFormData('unit_count', parseInt(e.target.value) || 0)}
                    className={`rounded-lg ${errors.unit_count ? 'border-red-500' : 'border-sage-200'}`}
                    placeholder="120"
                  />
                  {errors.unit_count && <p className="text-red-500 text-sm mt-1">{errors.unit_count}</p>}
                </div>
                
                <div>
                  <Label htmlFor="ami_min">Min AMI % *</Label>
                  <Input
                    id="ami_min"
                    type="number"
                    min="0"
                    max="200"
                    value={formData.ami_min || ''}
                    onChange={(e) => updateFormData('ami_min', parseInt(e.target.value) || 0)}
                    className={`rounded-lg ${errors.ami_min ? 'border-red-500' : 'border-sage-200'}`}
                    placeholder="30"
                  />
                  {errors.ami_min && <p className="text-red-500 text-sm mt-1">{errors.ami_min}</p>}
                </div>
                
                <div>
                  <Label htmlFor="ami_max">Max AMI % *</Label>
                  <Input
                    id="ami_max"
                    type="number"
                    min="0"
                    max="200"
                    value={formData.ami_max || ''}
                    onChange={(e) => updateFormData('ami_max', parseInt(e.target.value) || 0)}
                    className={`rounded-lg ${errors.ami_max ? 'border-red-500' : 'border-sage-200'}`}
                    placeholder="80"
                  />
                  {errors.ami_max && <p className="text-red-500 text-sm mt-1">{errors.ami_max}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="est_delivery">Estimated Delivery Date</Label>
                  <Input
                    id="est_delivery"
                    type="date"
                    value={formData.est_delivery}
                    onChange={(e) => updateFormData('est_delivery', e.target.value)}
                    className="rounded-lg border-sage-200"
                  />
                </div>
                
                <div>
                  <Label htmlFor="total_investment">Total Investment ($)</Label>
                  <Input
                    id="total_investment"
                    type="number"
                    min="0"
                    value={formData.metadata_json.total_investment || ''}
                    onChange={(e) => updateFormData('metadata_json.total_investment', parseInt(e.target.value) || 0)}
                    className="rounded-lg border-sage-200"
                    placeholder="25000000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-sage-600" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Contact details for project inquiries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.metadata_json.contact_email}
                    onChange={(e) => updateFormData('metadata_json.contact_email', e.target.value)}
                    className="rounded-lg border-sage-200"
                    placeholder="contact@developer.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.metadata_json.contact_phone}
                    onChange={(e) => updateFormData('metadata_json.contact_phone', e.target.value)}
                    className="rounded-lg border-sage-200"
                    placeholder="(555) 123-4567"
                  />
                </div>
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