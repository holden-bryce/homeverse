import { notFound } from 'next/navigation'
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
  const [project, profile] = await Promise.all([
    getProject(params.id),
    getUserProfile()
  ])
  
  if (!project) {
    notFound()
  }
  
  // Check if user can edit this project
  const canEdit = profile?.role && ['developer', 'admin'].includes(profile.role) && 
                  profile.company_id === project.company_id
  
  if (!canEdit) {
    notFound()
  }
  
  return <ProjectEditClient project={project} />
}