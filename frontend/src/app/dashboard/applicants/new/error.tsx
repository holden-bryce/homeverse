'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console in development
    console.error('Applicant creation error:', error)
  }, [error])

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Error Creating Applicant
            </CardTitle>
            <CardDescription>
              Something went wrong while trying to create the applicant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">
                {error.message || 'An unexpected error occurred'}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button onClick={reset} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Link href="/dashboard/applicants">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Applicants
                </Button>
              </Link>
            </div>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p>If this error persists, please try:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Refreshing the page</li>
                <li>Logging out and back in</li>
                <li>Contacting support if the issue continues</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}