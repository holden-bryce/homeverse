'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createApplication } from '@/app/dashboard/applications/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { Send, Loader2 } from 'lucide-react'

interface ApplicationFormProps {
  projectId: string
  projectName: string
  userProfile: {
    full_name?: string
    email?: string
  }
}

export function ApplicationForm({ projectId, projectName, userProfile }: ApplicationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    
    try {
      // Add project_id to form data
      formData.append('project_id', projectId)
      
      // Log for debugging
      console.log('Submitting application for project:', projectId)
      console.log('Form data:', Object.fromEntries(formData))
      
      await createApplication(formData)
      
      // Success - show toast and redirect
      toast({
        title: "Application Submitted!",
        description: `Your application for ${projectName} has been submitted successfully.`,
        variant: "default"
      })
      
      // Redirect to applications tab
      router.push('/dashboard/buyers?tab=applications&success=true')
    } catch (error) {
      console.error('Application submission error:', error)
      
      // Show error toast
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive"
      })
      
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
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
                defaultValue={userProfile.full_name}
                required
                className="rounded-lg border-sage-200"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address*</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={userProfile.email}
                readOnly
                required
                className="rounded-lg border-sage-200 bg-gray-50"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number*</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(555) 123-4567"
              required
              className="rounded-lg border-sage-200"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="current_address">Current Address</Label>
            <Input
              id="current_address"
              name="current_address"
              placeholder="123 Main St, City, State ZIP"
              className="rounded-lg border-sage-200"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Household Information */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Household Information</CardTitle>
          <CardDescription>
            Tell us about your household
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
                max="10"
                defaultValue="1"
                required
                className="rounded-lg border-sage-200"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="annual_income">Annual Income*</Label>
              <Input
                id="annual_income"
                name="annual_income"
                type="number"
                min="0"
                placeholder="50000"
                required
                className="rounded-lg border-sage-200"
                disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>
            Any additional details you'd like to share
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="additional_notes"
            name="additional_notes"
            placeholder="Tell us why you're interested in this property..."
            rows={4}
            className="rounded-lg border-sage-200"
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button 
          type="submit"
          disabled={isSubmitting}
          className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Application
            </>
          )}
        </Button>
      </div>
    </form>
  )
}