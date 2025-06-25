import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
// Removed client-side import from server component
import { 
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Users,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { createApplication } from '@/app/dashboard/applications/actions'
import { SubmitButton } from './submit-button'

interface ApplicationPageProps {
  params: {
    id: string
  }
}

async function getProject(id: string) {
  const supabase = createClient()
  
  const { data: project, error } = await supabase
    .from('projects')
    .select('*, companies(name)')
    .eq('id', id)
    .single()
    
  if (error || !project) {
    return null
  }
  
  return project
}

// SubmitButton moved to separate client component

export default async function ApplicationPage({ params }: ApplicationPageProps) {
  // In Next.js 15, params might be a Promise
  const resolvedParams = await Promise.resolve(params)
  
  const [project, profile] = await Promise.all([
    getProject(resolvedParams.id),
    getUserProfile()
  ])
  
  if (!project) {
    notFound()
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to apply for this property.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  async function applyToProject(formData: FormData) {
    'use server'
    
    // Add project_id to form data
    formData.append('project_id', project.id)
    
    const { createApplication } = await import('@/app/dashboard/applications/actions')
    await createApplication(formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/projects/${project.id}`} className="group">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full hover:bg-sage-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Project
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Apply for {project.name}</h1>
            <p className="text-gray-600 mt-1">
              Submit your application for affordable housing
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Form */}
          <div className="lg:col-span-2">
            <form action={applyToProject} className="space-y-6">
              {/* Personal Information */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Please provide your contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name*</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        defaultValue={profile.full_name}
                        required
                        className="rounded-lg border-sage-200"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email Address*</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={profile.email}
                        required
                        className="rounded-lg border-sage-200"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number*</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="rounded-lg border-sage-200"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="current_address">Current Address</Label>
                    <Input
                      id="current_address"
                      name="current_address"
                      className="rounded-lg border-sage-200"
                      placeholder="123 Main St, City, State ZIP"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Household Information */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Household Information</CardTitle>
                  <CardDescription>
                    Help us understand your housing needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="household_size">Household Size*</Label>
                      <Input
                        id="household_size"
                        name="household_size"
                        type="number"
                        min="1"
                        required
                        className="rounded-lg border-sage-200"
                        placeholder="Number of people"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="annual_income">Annual Household Income*</Label>
                      <Input
                        id="annual_income"
                        name="annual_income"
                        type="number"
                        min="0"
                        required
                        className="rounded-lg border-sage-200"
                        placeholder="$"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employment_status">Employment Status</Label>
                      <select
                        id="employment_status"
                        name="employment_status"
                        className="w-full mt-1 rounded-lg border-sage-200 focus:border-sage-500 focus:ring-sage-500"
                      >
                        <option value="">Select status...</option>
                        <option value="employed">Employed</option>
                        <option value="self-employed">Self-Employed</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="retired">Retired</option>
                        <option value="student">Student</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="employer_name">Employer Name</Label>
                      <Input
                        id="employer_name"
                        name="employer_name"
                        className="rounded-lg border-sage-200"
                        placeholder="Company name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="preferred_move_in_date">Preferred Move-in Date</Label>
                    <Input
                      id="preferred_move_in_date"
                      name="preferred_move_in_date"
                      type="date"
                      className="rounded-lg border-sage-200"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                  <CardDescription>
                    Someone we can contact in case of emergency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact_name">Contact Name</Label>
                      <Input
                        id="emergency_contact_name"
                        name="emergency_contact_name"
                        className="rounded-lg border-sage-200"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                      <Input
                        id="emergency_contact_phone"
                        name="emergency_contact_phone"
                        type="tel"
                        className="rounded-lg border-sage-200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>
                    Anything else you'd like us to know
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    id="additional_notes"
                    name="additional_notes"
                    rows={4}
                    className="w-full rounded-lg border-sage-200 focus:border-sage-500 focus:ring-sage-500"
                    placeholder="Tell us about any special circumstances, accommodations needed, or other relevant information..."
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link href={`/dashboard/projects/${project.id}`}>
                  <Button variant="outline" className="rounded-full">
                    Cancel
                  </Button>
                </Link>
                <SubmitButton />
              </div>
            </form>
          </div>

          {/* Property Summary */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5 text-sage-600" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <MapPin className="inline-block h-3 w-3 mr-1" />
                    {project.address}, {project.city}, {project.state}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Units</span>
                    <span className="font-medium">{project.total_units}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Affordable Units</span>
                    <span className="font-medium">{project.affordable_units}</span>
                  </div>
                  {project.ami_levels && project.ami_levels.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">AMI Levels</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {project.ami_levels.map((level: string) => (
                          <Badge key={level} variant="secondary" className="text-xs rounded-full">
                            {level} AMI
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Application Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Ensure all information is accurate and up-to-date</li>
                  <li>• Have your income documentation ready</li>
                  <li>• Applications are processed in order received</li>
                  <li>• You will be notified by email of any updates</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}