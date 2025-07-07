'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { Trash2 } from 'lucide-react'
import { useDeleteApplicant } from '@/lib/supabase/hooks'
import { useConfirmationModal } from '@/components/ui/confirmation-modal'

interface ApplicantActionsProps {
  applicant: {
    id: string
    full_name?: string
    first_name?: string
    last_name?: string
  }
}

export function ApplicantActions({ applicant }: ApplicantActionsProps) {
  const router = useRouter()
  const deleteApplicant = useDeleteApplicant()
  const { confirm, ConfirmationModal } = useConfirmationModal()

  const handleDeleteApplicant = () => {
    const applicantName = applicant.full_name || 
                         `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || 
                         'Unknown Applicant'
    
    confirm({
      title: 'Delete Applicant',
      description: `Are you sure you want to delete ${applicantName}? This action cannot be undone and will permanently remove all their data, applications, and matching history.`,
      variant: 'danger',
      confirmText: 'Delete Applicant',
      onConfirm: async () => {
        try {
          await deleteApplicant.mutateAsync(applicant.id)
          toast({
            title: 'Applicant Deleted',
            description: `${applicantName} has been successfully deleted.`,
            variant: 'success'
          })
          router.push('/dashboard/applicants')
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
        onClick={handleDeleteApplicant}
        variant="outline"
        className="border-red-500 text-red-600 hover:bg-red-50"
        disabled={deleteApplicant.isPending}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
      {ConfirmationModal}
    </>
  )
}