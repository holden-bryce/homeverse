'use client'

import { useFormStatus } from 'react-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { createProject } from '../actions'
import { useState } from 'react'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit"
      disabled={pending}
      className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
    >
      {pending ? 'Creating...' : 'Create Project'}
    </Button>
  )
}

export default function NewProjectPage() {
  const [selectedAmiLevels, setSelectedAmiLevels] = useState<string[]>([])
  const amiLevels = ['30-50%', '50-80%', '80-120%']
  
  const toggleAmiLevel = (level: string) => {
    setSelectedAmiLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/projects" className="group">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full hover:bg-sage-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Project</h1>
            <p className="text-gray-600">Create a new affordable housing development</p>
          </div>
        </div>

        {/* Form */}
        <form action={createProject} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5 text-sage-600" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Enter the basic details about your housing project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name*</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  className="rounded-lg border-sage-200"
                  placeholder="e.g., Sunset Affordable Housing"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="rounded-lg border-sage-200"
                  placeholder="Describe the project, target demographic, and community impact..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-sage-600" />
                Location Details
              </CardTitle>
              <CardDescription>
                Specify where the project will be located
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address*</Label>
                <Input
                  id="address"
                  name="address"
                  required
                  className="rounded-lg border-sage-200"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="city">City*</Label>
                  <Input
                    id="city"
                    name="city"
                    required
                    className="rounded-lg border-sage-200"
                    placeholder="San Francisco"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    defaultValue="CA"
                    className="rounded-lg border-sage-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    name="zip_code"
                    className="rounded-lg border-sage-200"
                    placeholder="94102"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    defaultValue="37.7749"
                    className="rounded-lg border-sage-200"
                    placeholder="37.7749"
                  />
                </div>
                
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    defaultValue="-122.4194"
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
                Specify the housing units and affordability levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_units">Total Units*</Label>
                  <Input
                    id="total_units"
                    name="total_units"
                    type="number"
                    required
                    min="1"
                    className="rounded-lg border-sage-200"
                    placeholder="100"
                  />
                </div>
                
                <div>
                  <Label htmlFor="affordable_units">Affordable Units*</Label>
                  <Input
                    id="affordable_units"
                    name="affordable_units"
                    type="number"
                    required
                    min="0"
                    className="rounded-lg border-sage-200"
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <Label>AMI Levels</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Select the Area Median Income levels this project will serve
                </p>
                <div className="flex flex-wrap gap-2">
                  {amiLevels.map((level) => (
                    <Badge
                      key={level}
                      variant={selectedAmiLevels.includes(level) ? "default" : "outline"}
                      className={`cursor-pointer rounded-full transition-colors ${
                        selectedAmiLevels.includes(level) 
                          ? 'bg-sage-600 text-white border-sage-600' 
                          : 'border-sage-300 hover:bg-sage-100'
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        toggleAmiLevel(level)
                      }}
                    >
                      {level} AMI
                    </Badge>
                  ))}
                </div>
                <input 
                  type="hidden" 
                  name="ami_levels" 
                  value={JSON.stringify(selectedAmiLevels)} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/projects">
              <Button variant="outline" className="rounded-full">
                Cancel
              </Button>
            </Link>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  )
}