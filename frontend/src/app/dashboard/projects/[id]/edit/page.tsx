import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { EditProjectForm } from '@/components/projects/edit-project-form'

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
  const profile = await getUserProfile()
  
  if (!profile) {
    notFound()
  }
  
  const project = await getProject(params.id)
  
  if (!project) {
    notFound()
  }
  
  // Check if user can edit this project
  const canEdit = profile.role === 'admin' || 
    (profile.company_id === project.company_id && ['developer', 'admin'].includes(profile.role))
  
  if (!canEdit) {
    notFound()
  }
  
  return <EditProjectForm project={project} />
}