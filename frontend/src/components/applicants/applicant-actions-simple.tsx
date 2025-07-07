'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteApplicant } from '@/app/dashboard/applicants/actions'
import { useConfirmationModal } from '@/components/ui/confirmation-modal'
import { useToast } from '@/components/ui/toast'

interface ApplicantActionsProps {
  applicant: {
    id: string
    full_name?: string
    first_name?: string
    last_name?: string
  }
}

export function ApplicantActionsSimple({ applicant }: ApplicantActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { confirm, ConfirmationModal } = useConfirmationModal()

  const applicantName = applicant.full_name || 
                       `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || 
                       'Unknown Applicant'

  const handleDelete = () => {
    confirm({
      title: 'Delete Applicant',
      description: `Are you sure you want to delete ${applicantName}? This action cannot be undone and will permanently remove all their data, applications, and matching history.`,
      variant: 'danger',
      confirmText: 'Delete Applicant',
      onConfirm: async () => {
        try {
          await deleteApplicant(applicant.id)
          toast({
            title: 'Applicant Deleted',
            description: `${applicantName} has been successfully deleted.`,
          })
          router.push('/dashboard/applicants')
          router.refresh()
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to delete applicant. Please try again.',
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