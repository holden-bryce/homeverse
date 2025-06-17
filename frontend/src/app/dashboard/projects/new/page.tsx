'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { useCreateProject } from '@/lib/supabase/hooks'
import { sanitizeFormData } from '@/lib/utils/sanitize'

const projectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  developer: z.string().min(2, 'Developer name must be at least 2 characters'),
  location: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  total_units: z.number().min(1, 'Total units must be at least 1'),
  affordable_units: z.number().min(0).optional(),
  ami_levels: z.string().optional(),
  description: z.string().optional(),
  completion_date: z.string().optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

export default function NewProjectPage() {
  const router = useRouter()
  const createProject = useCreateProject()
  
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      latitude: 37.7749, // Default to SF
      longitude: -122.4194,
      total_units: 1,
      affordable_units: 0,
    }
  })

  const onSubmit = async (data: ProjectFormData) => {
    try {
      // Sanitize form data before submission
      const sanitizedData = sanitizeFormData(data)
      
      // Send data in format backend expects
      await createProject.mutateAsync(sanitizedData as any)
      
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className={`rounded-lg ${errors.name ? 'border-red-500' : 'border-sage-200'}`}
                    placeholder="e.g., Sunset Gardens"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>
                
                <div>
                  <Label htmlFor="developer">Developer Name *</Label>
                  <Input
                    id="developer"
                    {...register('developer')}
                    className={`rounded-lg ${errors.developer ? 'border-red-500' : 'border-sage-200'}`}
                    placeholder="e.g., Green Valley Development"
                  />
                  {errors.developer && <p className="text-red-500 text-sm mt-1">{errors.developer.message}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
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
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  {...register('address')}
                  className={`rounded-lg ${errors.address ? 'border-red-500' : 'border-sage-200'}`}
                  placeholder="e.g., 123 Main Street"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    className={`rounded-lg ${errors.city ? 'border-red-500' : 'border-sage-200'}`}
                    placeholder="San Francisco"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    {...register('state')}
                    className="rounded-lg border-sage-200"
                    placeholder="CA"
                    defaultValue="CA"
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    {...register('zip_code')}
                    className="rounded-lg border-sage-200"
                    placeholder="94102"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location Description</Label>
                <Input
                  id="location"
                  {...register('location')}
                  className="rounded-lg border-sage-200"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    {...register('latitude', { valueAsNumber: true })}
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
                    {...register('longitude', { valueAsNumber: true })}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="total_units">Total Units *</Label>
                  <Input
                    id="total_units"
                    type="number"
                    min="1"
                    {...register('total_units', { valueAsNumber: true })}
                    className={`rounded-lg ${errors.total_units ? 'border-red-500' : 'border-sage-200'}`}
                    placeholder="120"
                  />
                  {errors.total_units && <p className="text-red-500 text-sm mt-1">{errors.total_units.message}</p>}
                </div>
                
                <div>
                  <Label htmlFor="affordable_units">Affordable Units</Label>
                  <Input
                    id="affordable_units"
                    type="number"
                    min="0"
                    {...register('affordable_units', { valueAsNumber: true })}
                    className="rounded-lg border-sage-200"
                    placeholder="96"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ami_levels">AMI Levels</Label>
                  <Input
                    id="ami_levels"
                    {...register('ami_levels')}
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
                  {...register('completion_date')}
                  className="rounded-lg border-sage-200"
                />
              </div>
            </CardContent>
          </Card>


          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4">
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
              loading={createProject.isPending}
              className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
            >
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}