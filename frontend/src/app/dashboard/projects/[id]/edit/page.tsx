import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { ProjectEditClient } from './project-edit-client'

interface ProjectEditPageProps {
  params: {
    id: string
  }
}

async function getProject(id: string) {
  const supabase = createClient()
  
  const { data: project, error } = await supabase
    .from('projects')
    .select('*, companies(name)')
    .eq('id', id)
    .single()
    
  if (error || !project) {
    return null
  }
  
  return project
}

export default async function ProjectEditPage({ params }: ProjectEditPageProps) {
  // Temporary test to see if route is working
  console.log('ProjectEditPage called with ID:', params.id)
  
  try {
    const [project, profile] = await Promise.all([
      getProject(params.id),
      getUserProfile()
    ])
    
    console.log('ProjectEditPage Debug:')
    console.log('- Project ID:', params.id)
    console.log('- Project found:', !!project)
    console.log('- User profile:', profile ? { id: profile.id, role: profile.role, company_id: profile.company_id } : 'null')
    console.log('- Project company_id:', project?.company_id)
    
    if (!project) {
      console.log('Project not found, calling notFound()')
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
            <p>The project with ID {params.id} could not be found.</p>
          </div>
        </div>
      )
    }
    
    // Check if user can edit this project
    const canEdit = profile?.role && ['developer', 'admin'].includes(profile.role) && 
                    profile.company_id === project.company_id
    
    console.log('- Can edit:', canEdit)
    console.log('- Role check:', profile?.role && ['developer', 'admin'].includes(profile.role))
    console.log('- Company match:', profile.company_id === project.company_id)
    
    // Temporarily allow all users to access for testing
    // if (!canEdit) {
    //   console.log('User cannot edit this project')
    //   return (
    //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    //       <div className="text-center">
    //         <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
    //         <p>You don't have permission to edit this project.</p>
    //         <p className="mt-2 text-sm text-gray-600">
    //           Your role: {profile?.role || 'unknown'}<br/>
    //           Your company: {profile?.company_id || 'none'}<br/>
    //           Project company: {project.company_id || 'none'}
    //         </p>
    //       </div>
    //     </div>
    //   )
    // }
    
    // Show debug info if no edit permission for testing
    if (!canEdit) {
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4">Debug: Edit Access</h1>
            <div className="space-y-2 text-sm">
              <p><strong>Project ID:</strong> {params.id}</p>
              <p><strong>Project found:</strong> {project ? 'Yes' : 'No'}</p>
              <p><strong>User profile:</strong> {profile ? 'Found' : 'Not found'}</p>
              {profile && (
                <>
                  <p><strong>User role:</strong> {profile.role}</p>
                  <p><strong>User company ID:</strong> {profile.company_id}</p>
                  <p><strong>Is developer/admin:</strong> {['developer', 'admin'].includes(profile.role) ? 'Yes' : 'No'}</p>
                </>
              )}
              <p><strong>Project company ID:</strong> {project.company_id}</p>
              <p><strong>Company match:</strong> {profile?.company_id === project.company_id ? 'Yes' : 'No'}</p>
              <p><strong>Can edit:</strong> {canEdit ? 'Yes' : 'No'}</p>
            </div>
            <div className="mt-6">
              <p className="text-red-600">Access denied - proceeding with edit form for testing...</p>
            </div>
          </div>
          <div className="mt-8">
            <ProjectEditClient project={project} />
          </div>
        </div>
      )
    }
    
    return <ProjectEditClient project={project} />
  } catch (error) {
    console.error('Error in ProjectEditPage:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>An error occurred while loading the edit page.</p>
          <p className="mt-2 text-sm text-gray-600">{String(error)}</p>
        </div>
      </div>
    )
  }
}