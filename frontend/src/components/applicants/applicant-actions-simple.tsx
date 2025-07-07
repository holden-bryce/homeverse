'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteApplicant } from '@/app/dashboard/applicants/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const applicantName = applicant.full_name || 
                       `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || 
                       'Unknown Applicant'

  const handleDelete = async () => {
    setIsDeleting(true)
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
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowDeleteDialog(true)}
        variant="outline"
        className="border-red-500 text-red-600 hover:bg-red-50"
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Applicant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {applicantName}? This action cannot be undone and will permanently remove all their data, applications, and matching history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Applicant'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}