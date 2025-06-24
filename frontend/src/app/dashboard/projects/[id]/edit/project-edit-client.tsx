'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { 
  ArrowLeft,
  Save
} from 'lucide-react'

interface ProjectEditClientProps {
  project: any
}

export function ProjectEditClient({ project }: ProjectEditClientProps) {
  const router = useRouter()
  
  // Form state
  const [formData, setFormData] = useState({
    name: project.name || '',
    description: project.description || '',
    address: project.address || '',
    city: project.city || '',
    state: project.state || 'CA',
    zip_code: project.zip_code || '',
    developer_name: project.companies?.name || project.developer_name || '',
    total_units: project.total_units?.toString() || '',
    affordable_units: project.affordable_units?.toString() || '',
    ami_levels: project.ami_levels || [],
    unit_types: project.unit_types || [],
    price_range: project.price_range || '',
    monthly_rent: project.monthly_rent?.toString() || '',
    bedrooms: project.bedrooms?.toString() || '',
    bathrooms: project.bathrooms?.toString() || '',
    square_feet: project.square_feet?.toString() || '',
    completion_date: project.completion_date || project.estimated_delivery || '',
    latitude: project.latitude?.toString() || '',
    longitude: project.longitude?.toString() || '',
    status: project.status || 'planning',
    amenities: project.amenities || [],
    pet_policy: project.pet_policy || '',
    parking: project.parking || '',
    laundry: project.laundry || '',
    application_fee: project.application_fee?.toString() || '',
    security_deposit: project.security_deposit?.toString() || '',
    move_in_cost: project.move_in_cost?.toString() || '',
    transit_notes: project.transit_notes || '',
    school_district: project.school_district || '',
    walk_score: project.walk_score?.toString() || '',
    transit_score: project.transit_score?.toString() || '',
    contact_email: project.contact_email || '',
    contact_phone: project.contact_phone || '',
    website: project.website || '',
  })
  
  const [isSaving, setIsSaving] = useState(false)

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
        monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        square_feet: formData.square_feet ? parseInt(formData.square_feet) : undefined,
        description: formData.description,
        estimated_delivery: formData.completion_date,
        status: formData.status,
        amenities: formData.amenities,
        pet_policy: formData.pet_policy,
        parking: formData.parking,
        laundry: formData.laundry,
        application_fee: formData.application_fee ? parseFloat(formData.application_fee) : undefined,
        security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : undefined,
        move_in_cost: formData.move_in_cost ? parseFloat(formData.move_in_cost) : undefined,
        transit_notes: formData.transit_notes,
        school_district: formData.school_district,
        walk_score: formData.walk_score ? parseInt(formData.walk_score) : undefined,
        transit_score: formData.transit_score ? parseInt(formData.transit_score) : undefined,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website: formData.website,
      }

      // Make PUT request to update the project
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/projects/${project.id}`, {
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
        router.push(`/dashboard/projects/${project.id}`)
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
                    value={Array.isArray(formData.ami_levels) ? formData.ami_levels.join(', ') : formData.ami_levels}
                    onChange={(e) => handleInputChange('ami_levels', e.target.value ? [e.target.value] : [])}
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
                  <Label htmlFor="monthly_rent">Monthly Rent</Label>
                  <Input
                    id="monthly_rent"
                    type="number"
                    value={formData.monthly_rent}
                    onChange={(e) => handleInputChange('monthly_rent', e.target.value)}
                    className="mt-1"
                    placeholder="1500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="square_feet">Square Feet</Label>
                  <Input
                    id="square_feet"
                    type="number"
                    value={formData.square_feet}
                    onChange={(e) => handleInputChange('square_feet', e.target.value)}
                    className="mt-1"
                    placeholder="850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    className="mt-1"
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    className="mt-1"
                    placeholder="1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="parking">Parking</Label>
                  <Input
                    id="parking"
                    value={formData.parking}
                    onChange={(e) => handleInputChange('parking', e.target.value)}
                    className="mt-1"
                    placeholder="1 space included"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pet_policy">Pet Policy</Label>
                  <Input
                    id="pet_policy"
                    value={formData.pet_policy}
                    onChange={(e) => handleInputChange('pet_policy', e.target.value)}
                    className="mt-1"
                    placeholder="Cats allowed, dogs under 25lbs"
                  />
                </div>
                <div>
                  <Label htmlFor="laundry">Laundry</Label>
                  <Input
                    id="laundry"
                    value={formData.laundry}
                    onChange={(e) => handleInputChange('laundry', e.target.value)}
                    className="mt-1"
                    placeholder="In-unit washer/dryer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="application_fee">Application Fee ($)</Label>
                  <Input
                    id="application_fee"
                    type="number"
                    value={formData.application_fee}
                    onChange={(e) => handleInputChange('application_fee', e.target.value)}
                    className="mt-1"
                    placeholder="50"
                  />
                </div>
                <div>
                  <Label htmlFor="security_deposit">Security Deposit ($)</Label>
                  <Input
                    id="security_deposit"
                    type="number"
                    value={formData.security_deposit}
                    onChange={(e) => handleInputChange('security_deposit', e.target.value)}
                    className="mt-1"
                    placeholder="1500"
                  />
                </div>
                <div>
                  <Label htmlFor="move_in_cost">Total Move-in Cost ($)</Label>
                  <Input
                    id="move_in_cost"
                    type="number"
                    value={formData.move_in_cost}
                    onChange={(e) => handleInputChange('move_in_cost', e.target.value)}
                    className="mt-1"
                    placeholder="3050"
                  />
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="walk_score">Walk Score (0-100)</Label>
                  <Input
                    id="walk_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.walk_score}
                    onChange={(e) => handleInputChange('walk_score', e.target.value)}
                    className="mt-1"
                    placeholder="85"
                  />
                </div>
                <div>
                  <Label htmlFor="transit_score">Transit Score (0-100)</Label>
                  <Input
                    id="transit_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.transit_score}
                    onChange={(e) => handleInputChange('transit_score', e.target.value)}
                    className="mt-1"
                    placeholder="78"
                  />
                </div>
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