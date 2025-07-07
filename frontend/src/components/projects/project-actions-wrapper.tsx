'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import { ProjectActions } from './project-actions'

interface ProjectActionsWrapperProps {
  project: {
    id: string
    name: string
    company_id: string
  }
  profile: {
    role: string
    company_id: string
  } | null
}

export function ProjectActionsWrapper({ project, profile }: ProjectActionsWrapperProps) {
  const canEdit = profile?.role && ['developer', 'admin'].includes(profile.role) && 
                  profile.company_id === project.company_id

  if (!canEdit) return null

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="border-sage-200 text-sage-700 hover:bg-sage-50"
        asChild
      >
        <Link href={`/dashboard/projects/${project.id}/edit`}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Link>
      </Button>
      <ProjectActions project={project} />
    </div>
  )
}