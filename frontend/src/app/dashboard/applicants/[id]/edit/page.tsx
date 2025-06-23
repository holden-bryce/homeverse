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

interface EditApplicantProps {
  params: {
    id: string
  }
}

const applicantSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
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

export default function EditApplicantPage({ params }: EditApplicantProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ApplicantFormData>({
    resolver: zodResolver(applicantSchema),
  })

  useEffect(() => {
    const fetchApplicant = async () => {
      try {
        const token = localStorage.getItem('auth_token') || document.cookie.split('auth_token=')[1]?.split(';')[0]
        
        if (!token) {
          toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'Please log in again to continue.',
          })
          router.push('/auth/login')
          return
        }

        // First try to get specific applicant from API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/applicants/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const applicant = await response.json()
          reset(applicant)
        } else {
          // Fallback to demo data
          const demoApplicants = [
            {
              id: "demo_app_001",
              full_name: "Maria Rodriguez",
              email: "maria.rodriguez@email.com",
              phone: "(555) 123-4567",
              household_size: 3,
              income: 45000,
              ami_percent: 65,
              location_preference: "Oakland, CA",
              latitude: 37.8044,
              longitude: -122.2711,
            },
            {
              id: "demo_app_002", 
              full_name: "James Chen",
              email: "james.chen@email.com",
              phone: "(555) 234-5678",
              household_size: 2,
              income: 52000,
              ami_percent: 75,
              location_preference: "San Francisco, CA",
              latitude: 37.7749,
              longitude: -122.4194,
            }
          ]
          
          const demoApplicant = demoApplicants.find(app => app.id === params.id)
          if (demoApplicant) {
            reset(demoApplicant)
          } else {
            toast({
              variant: 'destructive',
              title: 'Not Found',
              description: 'Applicant not found.',
            })
            router.push('/dashboard/applicants')
            return
          }
        }
      } catch (error) {
        console.error('Error fetching applicant:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load applicant details.',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplicant()
  }, [params.id, router, reset])

  const onSubmit = async (data: ApplicantFormData) => {
    setIsSubmitting(true)
    
    try {
      const token = localStorage.getItem('auth_token') || document.cookie.split('auth_token=')[1]?.split(';')[0]
      
      if (!token) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'Please log in again to continue.',
        })
        return
      }

      // Make PUT request to update the applicant
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/applicants/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          variant: 'success',
          title: 'Success!',
          description: 'Applicant updated successfully.',
        })
        
        router.push(`/dashboard/applicants/${params.id}`)
      } else {
        throw new Error('Failed to update applicant')
      }
    } catch (error) {
      console.error('Error updating applicant:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update applicant. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Applicant</h1>
          <p className="text-muted-foreground">Update applicant information and preferences</p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Applicant Information</CardTitle>
          <CardDescription>
            Update the applicant's details and housing preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  {...register('full_name')}
                  placeholder="John Doe"
                  className={errors.full_name ? 'border-red-500' : ''}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>
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
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Applicant
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