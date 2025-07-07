'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteProject } from '@/app/dashboard/projects/actions'
import { useConfirmationModal } from '@/components/ui/confirmation-modal'
import { useToast } from '@/components/ui/toast'

interface ProjectActionsProps {
  project: {
    id: string
    name: string
  }
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { confirm, ConfirmationModal } = useConfirmationModal()

  const handleDelete = () => {
    confirm({
      title: 'Delete Project',
      description: `Are you sure you want to delete ${project.name}? This action cannot be undone and will permanently remove the project and all associated data.`,
      variant: 'danger',
      confirmText: 'Delete Project',
      onConfirm: async () => {
        try {
          await deleteProject(project.id)
          toast({
            title: 'Project Deleted',
            description: `${project.name} has been successfully deleted.`,
          })
          router.push('/dashboard/projects')
          router.refresh()
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to delete project. Please try again.',
            variant: 'destructive'
          })
          throw error // Re-throw to keep modal open on error
        }
      }
    })
  }

  return (
    <>
      <Button
        onClick={handleDelete}
        variant="outline"
        className="border-red-500 text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
      {ConfirmationModal}
    </>
  )
}