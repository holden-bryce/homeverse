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
import { useToast } from '@/components/ui/use-toast'

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
      // Add ami_levels as JSON string
      const amiLevels = formData.get('ami_levels') as string
      if (amiLevels) {
        formData.set('ami_levels', JSON.stringify(amiLevels.split(',').map(s => s.trim()).filter(s => s)))
      } else {
        formData.set('ami_levels', '[]')
      }
      
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