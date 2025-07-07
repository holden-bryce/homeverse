'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { updateApplicant } from '@/app/dashboard/applicants/actions'
import { useToast } from '@/components/ui/use-toast'

interface EditApplicantFormProps {
  applicant: {
    id: string
    first_name?: string
    last_name?: string
    email: string
    phone?: string
    household_size?: number
    income?: number
    ami_percent?: number
    location_preference?: string
    status?: string
  }
}

export function EditApplicantForm({ applicant }: EditApplicantFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const fullName = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim()
  
  async function handleSubmit(formData: FormData) {
    try {
      await updateApplicant(applicant.id, formData)
      toast({
        title: 'Success',
        description: 'Applicant updated successfully.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update applicant. Please try again.',
        variant: 'destructive'
      })
    }
  }
  
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/dashboard/applicants/${applicant.id}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applicant
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold text-gray-900">Edit Applicant</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update applicant information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Applicant Information</CardTitle>
            <CardDescription>
              All fields marked with * are required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    required
                    defaultValue={fullName}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    defaultValue={applicant.email}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={applicant.phone || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="household_size">Household Size</Label>
                  <Input
                    id="household_size"
                    name="household_size"
                    type="number"
                    min="1"
                    max="10"
                    defaultValue={applicant.household_size || 1}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="income">Annual Income</Label>
                  <Input
                    id="income"
                    name="income"
                    type="number"
                    min="0"
                    defaultValue={applicant.income || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="ami_percent">AMI Percentage</Label>
                  <Input
                    id="ami_percent"
                    name="ami_percent"
                    type="number"
                    min="0"
                    max="200"
                    defaultValue={applicant.ami_percent || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="location_preference">Location Preference</Label>
                  <Input
                    id="location_preference"
                    name="location_preference"
                    defaultValue={applicant.location_preference || ''}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                    defaultValue={applicant.status || 'pending'}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Link href={`/dashboard/applicants/${applicant.id}`}>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}