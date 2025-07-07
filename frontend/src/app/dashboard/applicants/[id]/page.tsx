import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Edit, Mail, Phone, Users, DollarSign, MapPin, Trash2 } from 'lucide-react'
import { ApplicantActions } from '@/components/applicants/applicant-actions'
import { ApplicantDetailActions } from '@/components/applicants/applicant-detail-actions'

interface ApplicantDetailPageProps {
  params: {
    id: string
  }
}

async function getApplicant(id: string) {
  try {
    const supabase = createClient()
    
    const { data: applicant, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('id', id)
      .single()
      
    if (error) {
      console.error('Applicant fetch error:', error)
      return null
    }
    
    return applicant
  } catch (error) {
    console.error('Unexpected error fetching applicant:', error)
    return null
  }
}

export default async function ApplicantDetailPage({ params }: ApplicantDetailPageProps) {
  try {
    // Handle params safely
    const resolvedParams = await Promise.resolve(params)
    
    const [applicant, profile] = await Promise.all([
      getApplicant(resolvedParams.id),
      getUserProfile()
    ])
    
    if (!applicant) {
      notFound()
    }

    const canEdit = profile?.role && ['developer', 'admin'].includes(profile.role) && 
                    profile.company_id === applicant.company_id

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

    const applicantName = applicant.full_name || 
                         `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || 
                         'Unknown Applicant'

    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/applicants">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-sage-200 text-sage-700 hover:bg-sage-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{applicantName}</h1>
                <p className="text-muted-foreground">Applicant Profile</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={applicant.status === 'active' ? 'default' : 'secondary'}>
                {applicant.status}
              </Badge>
              {canEdit && (
                <>
                  <Link href={`/dashboard/applicants/${resolvedParams.id}/edit`}>
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <ApplicantActions applicant={applicant} />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
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
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
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
                {(applicant.ami_percent || applicant.preferences?.ami_percent) && (
                  <div>
                    <p className="text-sm font-medium">AMI Percentage</p>
                    <p className="text-sm text-muted-foreground">{applicant.ami_percent || applicant.preferences?.ami_percent}%</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Preferences */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(applicant.location_preference || applicant.preferences?.location_preference) && (
                  <div>
                    <p className="text-sm font-medium">Preferred Location</p>
                    <p className="text-sm text-muted-foreground">{applicant.location_preference || applicant.preferences?.location_preference}</p>
                  </div>
                )}
                {((applicant.latitude && applicant.longitude) || applicant.preferences?.coordinates) && (
                  <div>
                    <p className="text-sm font-medium">Coordinates</p>
                    <p className="text-sm text-muted-foreground">
                      {applicant.latitude && applicant.longitude
                        ? `${applicant.latitude.toFixed(4)}, ${applicant.longitude.toFixed(4)}`
                        : applicant.preferences?.coordinates
                        ? `${applicant.preferences.coordinates[0].toFixed(4)}, ${applicant.preferences.coordinates[1].toFixed(4)}`
                        : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Available actions for this applicant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Link href={`/dashboard/developers/matching?applicant=${resolvedParams.id}`}>
                  <Button variant="outline">
                    View Matches
                  </Button>
                </Link>
                <ApplicantDetailActions email={applicant.email} />
                {canEdit && (
                  <Link href={`/dashboard/applicants/${resolvedParams.id}/edit`}>
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
    
  } catch (error) {
    console.error('ApplicantDetailPage error:', error)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Error Loading Applicant</CardTitle>
              <CardDescription className="text-red-600">
                There was an error loading the applicant details. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/applicants">
                <Button variant="outline" className="border-red-200 text-red-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Applicants
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}