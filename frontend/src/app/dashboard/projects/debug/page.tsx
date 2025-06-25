'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProjectDebugPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchProjects()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) {
        setError('No company assigned to user')
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(`Error fetching projects: ${fetchError.message}`)
      } else {
        setProjects(data || [])
      }
    } catch (err) {
      setError(`Unexpected error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const testNavigation = (projectId: string, method: 'link' | 'router') => {
    console.log(`Testing navigation to project ${projectId} using ${method}`)
    if (method === 'router') {
      router.push(`/dashboard/projects/${projectId}`)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Navigation Debug Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Debug Information:</h3>
            <ul className="space-y-1 text-sm">
              <li>Loading: {loading ? 'Yes' : 'No'}</li>
              <li>Error: {error || 'None'}</li>
              <li>Projects Found: {projects.length}</li>
              <li>Current URL: {typeof window !== 'undefined' ? window.location.pathname : 'SSR'}</li>
            </ul>
          </div>

          {loading && <p>Loading projects...</p>}
          
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && projects.length === 0 && (
            <p className="text-gray-500">No projects found. Please create a project first.</p>
          )}

          {projects.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Test Project Navigation:</h3>
              {projects.map((project) => (
                <Card key={project.id} className="p-4">
                  <h4 className="font-medium mb-2">{project.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">ID: {project.id}</p>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                          Test with Link Component
                        </Button>
                      </Link>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testNavigation(project.id, 'router')}
                      >
                        Test with Router.push
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Direct URL: /dashboard/projects/{project.id}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">How to Debug:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Open browser developer console (F12)</li>
              <li>Click one of the test buttons above</li>
              <li>Check console for any errors</li>
              <li>Check network tab for failed requests</li>
              <li>Try accessing the URL directly in browser</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}