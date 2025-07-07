'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { updateProject } from '@/app/dashboard/projects/actions'
import { useToast } from '@/components/ui/toast'

interface EditProjectFormProps {
  project: {
    id: string
    name: string
    description?: string
    address?: string
    city?: string
    state?: string
    zip_code?: string
    total_units?: number
    affordable_units?: number
    ami_levels?: any[]
    status?: string
    [key: string]: any
  }
}

export function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  async function handleSubmit(formData: FormData) {
    try {
      await updateProject(project.id, formData)
      toast({
        title: 'Success',
        description: 'Project updated successfully.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive'
      })
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/dashboard/projects/${project.id}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update project information
          </p>
        </div>

        <form action={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core project details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={project.name}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={project.description || ''}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="total_units">Total Units *</Label>
                  <Input
                    id="total_units"
                    name="total_units"
                    type="number"
                    required
                    min="1"
                    defaultValue={project.total_units || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="affordable_units">Affordable Units</Label>
                  <Input
                    id="affordable_units"
                    name="affordable_units"
                    type="number"
                    min="0"
                    defaultValue={project.affordable_units || ''}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ami_levels">AMI Levels (comma-separated)</Label>
                <Input
                  id="ami_levels"
                  name="ami_levels"
                  placeholder="30%, 50%, 80%"
                  defaultValue={Array.isArray(project.ami_levels) ? project.ami_levels.join(', ') : ''}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="price_range">Price Range</Label>
                <Input
                  id="price_range"
                  name="price_range"
                  placeholder="$1,200 - $2,800"
                  defaultValue={project.price_range || ''}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unit Details</CardTitle>
              <CardDescription>
                Specific unit information and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    min="0"
                    defaultValue={project.bedrooms || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    step="0.5"
                    min="0"
                    defaultValue={project.bathrooms || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="square_feet">Square Feet</Label>
                  <Input
                    id="square_feet"
                    name="square_feet"
                    type="number"
                    min="0"
                    defaultValue={project.square_feet || ''}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="unit_types">Unit Types (comma-separated)</Label>
                <Input
                  id="unit_types"
                  name="unit_types"
                  placeholder="Studio, 1BR, 2BR, 3BR"
                  defaultValue={Array.isArray(project.unit_types) ? project.unit_types.join(', ') : ''}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="monthly_rent">Monthly Rent</Label>
                  <Input
                    id="monthly_rent"
                    name="monthly_rent"
                    type="number"
                    min="0"
                    defaultValue={project.monthly_rent || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_delivery">Estimated Completion Date</Label>
                  <Input
                    id="estimated_delivery"
                    name="estimated_delivery"
                    type="date"
                    defaultValue={project.estimated_delivery || ''}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Amenities & Features</CardTitle>
              <CardDescription>
                Building amenities and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  name="amenities"
                  placeholder="Gym, Pool, Parking, Laundry"
                  defaultValue={Array.isArray(project.amenities) ? project.amenities.join(', ') : ''}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="pet_policy">Pet Policy</Label>
                  <Input
                    id="pet_policy"
                    name="pet_policy"
                    placeholder="Cats allowed, dogs under 25lbs"
                    defaultValue={project.pet_policy || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="parking">Parking</Label>
                  <Input
                    id="parking"
                    name="parking"
                    placeholder="1 space included"
                    defaultValue={project.parking || ''}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="laundry">Laundry</Label>
                <Input
                  id="laundry"
                  name="laundry"
                  placeholder="In-unit washer/dryer"
                  defaultValue={project.laundry || ''}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fees & Costs</CardTitle>
              <CardDescription>
                Application fees and move-in costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <Label htmlFor="application_fee">Application Fee ($)</Label>
                  <Input
                    id="application_fee"
                    name="application_fee"
                    type="number"
                    min="0"
                    defaultValue={project.application_fee || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="security_deposit">Security Deposit ($)</Label>
                  <Input
                    id="security_deposit"
                    name="security_deposit"
                    type="number"
                    min="0"
                    defaultValue={project.security_deposit || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="move_in_cost">Total Move-in Cost ($)</Label>
                  <Input
                    id="move_in_cost"
                    name="move_in_cost"
                    type="number"
                    min="0"
                    defaultValue={project.move_in_cost || ''}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transportation & Area</CardTitle>
              <CardDescription>
                Location details and transportation options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="transit_notes">Transit & Transportation</Label>
                <Textarea
                  id="transit_notes"
                  name="transit_notes"
                  rows={2}
                  placeholder="Near BART station, bus lines 14 and 49..."
                  defaultValue={project.transit_notes || ''}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="school_district">School District</Label>
                <Input
                  id="school_district"
                  name="school_district"
                  placeholder="San Francisco Unified School District"
                  defaultValue={project.school_district || ''}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="walk_score">Walk Score (0-100)</Label>
                  <Input
                    id="walk_score"
                    name="walk_score"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={project.walk_score || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="transit_score">Transit Score (0-100)</Label>
                  <Input
                    id="transit_score"
                    name="transit_score"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={project.transit_score || ''}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How interested buyers can reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    defaultValue={project.contact_email || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    type="tel"
                    defaultValue={project.contact_phone || ''}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Project Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                  defaultValue={project.website || ''}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>
                Project address and location details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={project.address || ''}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={project.city || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    maxLength={2}
                    defaultValue={project.state || 'CA'}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  name="zip_code"
                  defaultValue={project.zip_code || ''}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="status">Project Status</Label>
                <select
                  id="status"
                  name="status"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                  defaultValue={project.status || 'planning'}
                >
                  <option value="planning">Planning</option>
                  <option value="approved">Approved</option>
                  <option value="construction">Under Construction</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Link href={`/dashboard/projects/${project.id}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}