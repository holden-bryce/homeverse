'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react'

export default function DemoDataPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()
  
  const seedDemoData = async () => {
    setIsLoading(true)
    setResults(null)
    
    try {
      const response = await fetch('/dashboard/demo/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResults(data.results)
        toast({
          title: 'Success!',
          description: data.message,
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to seed demo data',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to connect to server',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Demo Data Management</h1>
        
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-teal-600" />
              Seed Demo Data
            </CardTitle>
            <CardDescription>
              Add realistic demo data to showcase the platform. This will create sample applicants, 
              projects, and applications to make the app look great for presentations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This will add demo data to your current company. 
                Make sure you're logged in as an admin user.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">This will create:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>5 diverse applicant profiles with realistic data</li>
                <li>3 housing projects (active, construction, and senior living)</li>
                <li>Sample amenities, pricing, and location data</li>
                <li>Professional contact information and websites</li>
              </ul>
            </div>
            
            <Button 
              onClick={seedDemoData}
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Demo Data...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Seed Demo Data
                </>
              )}
            </Button>
            
            {results && (
              <div className="mt-4 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">Success!</h4>
                  </div>
                  <div className="space-y-1 text-sm text-green-700">
                    <p>✓ Created {results.applicants} applicants</p>
                    <p>✓ Created {results.projects} projects</p>
                  </div>
                </div>
                
                {results.errors && results.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold text-red-800">Some errors occurred:</h4>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                      {results.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="mt-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">After seeding the demo data:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Visit the <a href="/dashboard/applicants" className="text-teal-600 hover:underline">Applicants page</a> to see the new profiles</li>
              <li>Check the <a href="/dashboard/projects" className="text-teal-600 hover:underline">Projects page</a> to view housing developments</li>
              <li>Explore the <a href="/dashboard/map" className="text-teal-600 hover:underline">Map view</a> to see geographic distribution</li>
              <li>Try the <a href="/dashboard/developers/matching" className="text-teal-600 hover:underline">Matching feature</a> to connect applicants and projects</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}