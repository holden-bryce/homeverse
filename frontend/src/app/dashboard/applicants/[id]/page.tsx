'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { ArrowLeft, Edit, Mail, Phone, Users, DollarSign, MapPin, Loader2, Trash2 } from 'lucide-react'
import { useApplicant, useDeleteApplicant } from '@/lib/supabase/hooks'
import { useConfirmationModal } from '@/components/ui/confirmation-modal'

interface ApplicantDetailProps {
  params: {
    id: string
  }
}

interface Applicant {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  household_size?: number
  income?: number
  ami_percent?: number
  location_preference?: string
  latitude?: number
  longitude?: number
  status: string
  created_at: string
}

export default function ApplicantDetailPage({ params }: ApplicantDetailProps) {
  const router = useRouter()
  const { data: applicant, isLoading, error } = useApplicant(params.id)
  
  const deleteApplicant = useDeleteApplicant()
  const { confirm, ConfirmationModal } = useConfirmationModal()

  const handleDeleteApplicant = () => {
    if (!applicant) return
    
    const applicantName = `${applicant.first_name} ${applicant.last_name}`.trim()
    confirm({
      title: 'Delete Applicant',
      description: `Are you sure you want to delete ${applicantName}? This action cannot be undone and will permanently remove all their data, applications, and matching history.`,
      variant: 'danger',
      confirmText: 'Delete Applicant',
      onConfirm: async () => {
        try {
          await deleteApplicant.mutateAsync(applicant.id)
          toast({
            title: 'Applicant Deleted',
            description: `${applicantName} has been successfully deleted.`,
            variant: 'success'
          })
          router.push('/dashboard/applicants')
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to delete applicant. Please try again.',
            variant: 'destructive'
          })
          throw error // Re-throw to keep modal open on error
        }
      }
    })
  }

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load applicant details.',
      })
      router.push('/dashboard/applicants')
    }
  }, [error, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!applicant) {
    return (
      <div className="text-center py-8">
        <p>Applicant not found</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold tracking-tight">
              {applicant.first_name} {applicant.last_name}
            </h1>
            <p className="text-muted-foreground">Applicant Profile</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={applicant.status === 'active' ? 'default' : 'secondary'}>
            {applicant.status}
          </Badge>
          <Button
            onClick={() => router.push(`/dashboard/applicants/${params.id}/edit`)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={handleDeleteApplicant}
            variant="outline"
            className="border-red-500 text-red-600 hover:bg-red-50"
            disabled={deleteApplicant.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{applicant.email}</p>
            </div>
            {applicant.phone && (
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{applicant.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Member Since</p>
              <p className="text-sm text-muted-foreground">{formatDate(applicant.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Household Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Household Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {applicant.household_size && (
              <div>
                <p className="text-sm font-medium">Household Size</p>
                <p className="text-sm text-muted-foreground">{applicant.household_size} people</p>
              </div>
            )}
            {applicant.income && (
              <div>
                <p className="text-sm font-medium">Annual Income</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(applicant.income)}</p>
              </div>
            )}
            {applicant.ami_percent && (
              <div>
                <p className="text-sm font-medium">AMI Percentage</p>
                <p className="text-sm text-muted-foreground">{applicant.ami_percent}%</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {applicant.location_preference && (
              <div>
                <p className="text-sm font-medium">Preferred Location</p>
                <p className="text-sm text-muted-foreground">{applicant.location_preference}</p>
              </div>
            )}
            {applicant.latitude && applicant.longitude && (
              <div>
                <p className="text-sm font-medium">Coordinates</p>
                <p className="text-sm text-muted-foreground">
                  {applicant.latitude.toFixed(4)}, {applicant.longitude.toFixed(4)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Available actions for this applicant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push(`/dashboard/developers/matching?applicant=${params.id}`)}
              variant="outline"
            >
              View Matches
            </Button>
            <Button
              onClick={() => window.open(`mailto:${applicant.email}`, '_blank')}
              variant="outline"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/applicants/${params.id}/edit`)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>
      {ConfirmationModal}
    </div>
  )
}