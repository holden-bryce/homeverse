'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useCreateApplicant } from '@/lib/supabase/hooks'
import { sanitizeFormData } from '@/lib/utils/sanitize'
import { useAuth } from '@/providers/supabase-auth-provider'

const applicantSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  household_size: z.number().min(1).max(10).optional(),
  income: z.number().min(0).optional(),
  ami_percent: z.number().min(0).max(200).optional(),
  location_preference: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

type ApplicantFormData = z.infer<typeof applicantSchema>

export default function NewApplicantPage() {
  const router = useRouter()
  const createApplicant = useCreateApplicant()
  const { profile, refreshProfile } = useAuth()
  
  const { register, handleSubmit, formState: { errors } } = useForm<ApplicantFormData>({
    resolver: zodResolver(applicantSchema),
  })
  
  // Debug: Show current profile state and refresh if needed
  useEffect(() => {
    console.log('Current profile in NewApplicantPage:', profile)
    if (!profile || !profile.company_id) {
      console.warn('⚠️ No profile or company_id found! Refreshing profile...')
      refreshProfile()
    }
  }, [profile, refreshProfile])

  const onSubmit = async (data: ApplicantFormData) => {
    console.log('=== APPLICANT CREATION START ===')
    console.log('Form data:', data)
    console.log('Current profile:', profile)
    
    try {
      // Sanitize form data before submission
      const sanitizedData = sanitizeFormData(data)
      console.log('Sanitized data:', sanitizedData)
      
      // Send data in format backend expects
      const result = await createApplicant.mutateAsync(sanitizedData as any)
      console.log('Create result:', result)
      
      toast({
        variant: 'success',
        title: 'Success!',
        description: 'Applicant created successfully.',
      })
      
      router.push('/dashboard/applicants')
    } catch (error: any) {
      console.error('=== APPLICANT CREATION ERROR ===')
      console.error('Error details:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create applicant. Please try again.',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Applicant</h1>
          <p className="text-muted-foreground">Create a new housing applicant profile</p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Applicant Information</CardTitle>
          <CardDescription>
            Enter the applicant's details and housing preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  {...register('first_name')}
                  placeholder="John"
                  className={errors.first_name ? 'border-red-500' : ''}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.first_name.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  {...register('last_name')}
                  placeholder="Doe"
                  className={errors.last_name ? 'border-red-500' : ''}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="john.doe@email.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="household_size">Household Size</Label>
                <Input
                  id="household_size"
                  type="number"
                  min="1"
                  max="10"
                  {...register('household_size', { valueAsNumber: true })}
                  placeholder="3"
                />
              </div>
              
              <div>
                <Label htmlFor="income">Annual Income</Label>
                <Input
                  id="income"
                  type="number"
                  min="0"
                  {...register('income', { valueAsNumber: true })}
                  placeholder="50000"
                />
              </div>
              
              <div>
                <Label htmlFor="ami_percent">AMI Percentage</Label>
                <Input
                  id="ami_percent"
                  type="number"
                  min="0"
                  max="200"
                  {...register('ami_percent', { valueAsNumber: true })}
                  placeholder="80"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location_preference">Location Preference</Label>
              <Input
                id="location_preference"
                {...register('location_preference')}
                placeholder="San Francisco, CA"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createApplicant.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createApplicant.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {createApplicant.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Applicant
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}