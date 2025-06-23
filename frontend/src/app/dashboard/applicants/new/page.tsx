import { createApplicant } from '../actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewApplicantPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/applicants">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applicants
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold text-gray-900">Add New Applicant</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the applicant's information below
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
            <form action={createApplicant} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    required
                    placeholder="John Doe"
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
                    placeholder="john.doe@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
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
                    defaultValue="1"
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
                    placeholder="50000"
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
                    placeholder="60"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="location_preference">Location Preference</Label>
                  <Input
                    id="location_preference"
                    name="location_preference"
                    placeholder="Downtown, Near Transit, etc."
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Hidden fields for default coordinates */}
              <input type="hidden" name="latitude" value="40.7128" />
              <input type="hidden" name="longitude" value="-74.0060" />

              <div className="flex justify-end space-x-4">
                <Link href="/dashboard/applicants">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                  <Save className="mr-2 h-4 w-4" />
                  Save Applicant
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}