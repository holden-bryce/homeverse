'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'

interface SimpleProjectActionsProps {
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

export function SimpleProjectActions({ project, profile }: SimpleProjectActionsProps) {
  const canEdit = profile?.role && ['developer', 'admin'].includes(profile.role) && 
                  profile.company_id === project.company_id

  if (!canEdit) return null

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${project.name}? This action cannot be undone.`)) {
      // For now, just log - we can implement actual deletion later
      console.log('Delete project:', project.id)
      alert('Delete functionality will be implemented soon')
    }
  }

  return (
    <div className="flex gap-2">
      <Link href={`/dashboard/projects/${project.id}/edit`}>
        <Button
          variant="outline"
          className="border-sage-200 text-sage-700 hover:bg-sage-50"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </Link>
      <Button
        onClick={handleDelete}
        variant="outline"
        className="border-red-500 text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </div>
  )
}