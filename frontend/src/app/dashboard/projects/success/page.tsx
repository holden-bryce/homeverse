import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Building2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ProjectSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Project Created Successfully!</CardTitle>
          <CardDescription>
            Your project has been added and is now visible to applicants.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Your project is now live. You can manage it from your dashboard, add images, and track applications.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard/projects" className="flex-1">
              <Button className="w-full" variant="outline">
                View All Projects
              </Button>
            </Link>
            <Link href="/dashboard/projects/new" className="flex-1">
              <Button className="w-full bg-teal-600 hover:bg-teal-700">
                <Building2 className="mr-2 h-4 w-4" />
                Add Another
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}