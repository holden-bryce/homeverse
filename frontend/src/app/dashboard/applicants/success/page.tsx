import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ApplicantSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Applicant Created Successfully!</CardTitle>
          <CardDescription>
            The new applicant has been added to your system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Link href="/dashboard/applicants">
              <Button className="w-full bg-teal-600 hover:bg-teal-700">
                View All Applicants
              </Button>
            </Link>
            <Link href="/dashboard/applicants/new">
              <Button variant="outline" className="w-full">
                Add Another Applicant
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}