'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { 
  ArrowLeft,
  Save,
  MapPin,
  Building2,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  Home,
  Target
} from 'lucide-react'

// Mock project data - in real app, this would come from API
const getProjectById = (id: string) => {
  const projects = {
    '1': {
      id: '1',
      name: 'Sunset Gardens',
      developer: 'Urban Housing LLC',
      location: 'San Francisco, CA',
      address: '123 Sunset Boulevard, San Francisco, CA 94102',
      coordinates: { lat: 37.7749, lng: -122.4194 },
      description: 'Modern affordable housing in the heart of San Francisco with excellent transit access.',
      total_units: 120,
      ami_ranges: ['30%', '50%', '80%'],
      unit_types: ['Studio', '1BR', '2BR'],
      amenities: ['parking', 'playground', 'laundry', 'fitness'],
      estimated_delivery: '2024-12-15',
      construction_start: '2023-06-01',
      status: 'accepting_applications',
      price_ranges: {
        'Studio': { min: 1200, max: 1400 },
        '1BR': { min: 1500, max: 1800 },
        '2BR': { min: 2000, max: 2800 }
      },
      project_type: 'new_construction',
      financing_type: 'mixed',
    },
    '2': {
      id: '2',
      name: 'Riverside Commons',
      developer: 'Bay Area Developers',
      location: 'Oakland, CA',
      address: '456 River Street, Oakland, CA 94607',
      coordinates: { lat: 37.8044, lng: -122.2711 },
      description: 'Family-friendly community near top-rated schools and public transportation.',
      total_units: 85,
      ami_ranges: ['50%', '80%', '120%'],
      unit_types: ['1BR', '2BR', '3BR'],
      amenities: ['parking', 'transit', 'laundry', 'community_room'],
      estimated_delivery: '2025-03-20',
      construction_start: '2024-01-15',
      status: 'construction',
      price_ranges: {
        '1BR': { min: 1500, max: 1800 },
        '2BR': { min: 2000, max: 2500 },
        '3BR': { min: 2500, max: 3200 }
      },
      project_type: 'new_construction',
      financing_type: 'tax_credit',
    },
  }
  return projects[id as keyof typeof projects]
}

const amenityOptions = [
  { id: 'parking', label: 'Parking' },
  { id: 'transit', label: 'Transit Access' },
  { id: 'playground', label: 'Playground' },
  { id: 'fitness', label: 'Fitness Center' },
  { id: 'laundry', label: 'Laundry' },
  { id: 'pets', label: 'Pet Friendly' },
  { id: 'pool', label: 'Pool' },
  { id: 'community_room', label: 'Community Room' },
]

export default function ProjectEditPage() {
  const router = useRouter()
  const { id } = useParams()
  const project = getProjectById(id as string)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    total_units: '',
    estimated_delivery: '',
    construction_start: '',
    status: '',
    project_type: '',
    financing_type: '',
  })
  
  const [selectedAMI, setSelectedAMI] = useState<string[]>([])
  const [selectedUnitTypes, setSelectedUnitTypes] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [priceRanges, setPriceRanges] = useState<Record<string, { min: number; max: number }>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description,
        address: project.address,
        total_units: project.total_units.toString(),
        estimated_delivery: project.estimated_delivery,
        construction_start: project.construction_start,
        status: project.status,
        project_type: project.project_type,
        financing_type: project.financing_type,
      })
      setSelectedAMI(project.ami_ranges)
      setSelectedUnitTypes(project.unit_types)
      setSelectedAmenities(project.amenities)
      setPriceRanges(project.price_ranges)
    }
  }, [project])

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50 flex items-center justify-center">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
            <p className="text-gray-500 mb-4">The project you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard/developers')} className="rounded-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAMIToggle = (ami: string) => {
    setSelectedAMI(prev => 
      prev.includes(ami) 
        ? prev.filter(a => a !== ami)
        : [...prev, ami]
    )
  }

  const handleUnitTypeToggle = (unitType: string) => {
    setSelectedUnitTypes(prev => {
      const newTypes = prev.includes(unitType) 
        ? prev.filter(t => t !== unitType)
        : [...prev, unitType]
      
      // Update price ranges
      if (!prev.includes(unitType)) {
        setPriceRanges(prevPrices => ({
          ...prevPrices,
          [unitType]: { min: 1000, max: 2000 }
        }))
      } else {
        setPriceRanges(prevPrices => {
          const { [unitType]: removed, ...rest } = prevPrices
          return rest
        })
      }
      
      return newTypes
    })
  }

  const handleAmenityToggle = (amenityId: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId) 
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    )
  }

  const handlePriceRangeChange = (unitType: string, field: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0
    setPriceRanges(prev => ({
      ...prev,
      [unitType]: {
        ...prev[unitType],
        [field]: numValue
      }
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const requiredFields = ['name', 'description', 'address', 'total_units']
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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const updatedProject = {
      ...project,
      ...formData,
      total_units: parseInt(formData.total_units),
      ami_ranges: selectedAMI,
      unit_types: selectedUnitTypes,
      amenities: selectedAmenities,
      price_ranges: priceRanges,
      updated_at: new Date().toISOString(),
    }
    
    console.log('Saving project:', updatedProject)
    
    // Store in localStorage (in real app, would send to API)
    const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]')
    const updatedProjects = existingProjects.map((p: any) => 
      p.id === project.id ? updatedProject : p
    )
    if (!existingProjects.find((p: any) => p.id === project.id)) {
      updatedProjects.push(updatedProject)
    }
    localStorage.setItem('projects', JSON.stringify(updatedProjects))
    
    setIsSaving(false)
    
    toast({
      title: "Project updated",
      description: `${formData.name} has been updated successfully.`,
    })
    
    // Redirect back to project view
    router.push(`/dashboard/projects/${project.id}`)
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
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mt-1"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="mt-1"
                  required
                />
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
                  <Label htmlFor="project_type">Project Type</Label>
                  <Select value={formData.project_type} onValueChange={(value) => handleInputChange('project_type', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_construction">New Construction</SelectItem>
                      <SelectItem value="renovation">Renovation</SelectItem>
                      <SelectItem value="conversion">Conversion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="financing_type">Financing Type</Label>
                  <Select value={formData.financing_type} onValueChange={(value) => handleInputChange('financing_type', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select financing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tax_credit">Tax Credit</SelectItem>
                      <SelectItem value="mixed">Mixed Financing</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public Financing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Status */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Timeline & Status</CardTitle>
              <CardDescription>
                Project scheduling and current status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="construction_start">Construction Start</Label>
                  <Input
                    id="construction_start"
                    type="date"
                    value={formData.construction_start}
                    onChange={(e) => handleInputChange('construction_start', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_delivery">Estimated Delivery</Label>
                  <Input
                    id="estimated_delivery"
                    type="date"
                    value={formData.estimated_delivery}
                    onChange={(e) => handleInputChange('estimated_delivery', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Project Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="accepting_applications">Accepting Applications</SelectItem>
                      <SelectItem value="waitlist_only">Waitlist Only</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AMI Ranges */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>AMI Ranges</CardTitle>
              <CardDescription>
                Select the Area Median Income ranges this project serves
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {['30%', '50%', '60%', '80%', '100%', '120%'].map((ami) => (
                  <Button
                    key={ami}
                    type="button"
                    variant={selectedAMI.includes(ami) ? "default" : "outline"}
                    onClick={() => handleAMIToggle(ami)}
                    className="rounded-full"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    {ami} AMI
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Unit Types & Pricing */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Unit Types & Pricing</CardTitle>
              <CardDescription>
                Configure available unit types and their price ranges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 mb-4">
                {['Studio', '1BR', '2BR', '3BR', '4BR+'].map((unitType) => (
                  <Button
                    key={unitType}
                    type="button"
                    variant={selectedUnitTypes.includes(unitType) ? "default" : "outline"}
                    onClick={() => handleUnitTypeToggle(unitType)}
                    className="rounded-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    {unitType}
                  </Button>
                ))}
              </div>

              {selectedUnitTypes.length > 0 && (
                <div className="space-y-4">
                  <Label>Price Ranges</Label>
                  {selectedUnitTypes.map((unitType) => (
                    <div key={unitType} className="grid grid-cols-3 gap-4 items-center p-4 border border-gray-200 rounded-lg">
                      <div className="font-medium">{unitType}</div>
                      <div>
                        <Label className="text-sm">Min Price</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            type="number"
                            value={priceRanges[unitType]?.min || ''}
                            onChange={(e) => handlePriceRangeChange(unitType, 'min', e.target.value)}
                            className="pl-10"
                            placeholder="1000"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Max Price</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            type="number"
                            value={priceRanges[unitType]?.max || ''}
                            onChange={(e) => handlePriceRangeChange(unitType, 'max', e.target.value)}
                            className="pl-10"
                            placeholder="2000"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>
                Select amenities available in this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {amenityOptions.map((amenity) => (
                  <div
                    key={amenity.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                      selectedAmenities.includes(amenity.id)
                        ? 'border-sage-500 bg-sage-50'
                        : 'border-gray-200 hover:border-sage-300'
                    }`}
                    onClick={() => handleAmenityToggle(amenity.id)}
                  >
                    <div className="font-medium text-sm">{amenity.label}</div>
                  </div>
                ))}
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