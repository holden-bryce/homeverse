import { simpleCreateApplicant } from '../simple-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function SimpleNewApplicantPage() {
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
          
          <h1 className="text-2xl font-bold text-gray-900">Add New Applicant (Simplified)</h1>
          <p className="mt-1 text-sm text-gray-500">
            This is a simplified version for testing
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information Only</CardTitle>
            <CardDescription>
              Minimal fields to test applicant creation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={simpleCreateApplicant} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    required
                    defaultValue="Test"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    required
                    defaultValue="User"
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
                    defaultValue="test@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Hidden fields with defaults */}
              <input type="hidden" name="household_size" value="1" />
              <input type="hidden" name="income" value="50000" />
              <input type="hidden" name="ami_percent" value="80" />
              <input type="hidden" name="location_preference" value="Test Location" />
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
                  Create Test Applicant
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}