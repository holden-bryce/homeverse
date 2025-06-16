import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, UserPlus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ApplicantSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Applicant Created Successfully!</CardTitle>
          <CardDescription>
            The applicant has been added to your database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              You can now view the applicant in your list, edit their information, or add another applicant.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/applicants" className="flex-1">
              <Button className="w-full" variant="outline">
                View All Applicants
              </Button>
            </Link>
            <Link href="/dashboard/applicants/new" className="flex-1">
              <Button className="w-full bg-teal-600 hover:bg-teal-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Another
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}