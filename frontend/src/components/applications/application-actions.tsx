'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { updateApplicationStatus } from '@/app/dashboard/applications/actions'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, 
  Clock, 
  XCircle,
  MessageSquare,
  Loader2
} from 'lucide-react'

interface ApplicationActionsProps {
  applicationId: string
  currentStatus: string
}

export function ApplicationActions({ applicationId, currentStatus }: ApplicationActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'review' | null>(null)
  const [notes, setNotes] = useState('')
  const router = useRouter()
  
  const handleAction = async (action: 'approve' | 'reject' | 'review') => {
    setActionType(action)
    setDialogOpen(true)
    setNotes('')
  }
  
  const confirmAction = async () => {
    if (!actionType) return
    
    try {
      setIsUpdating(true)
      
      const statusMap = {
        'approve': 'approved',
        'reject': 'rejected',
        'review': 'under_review'
      }
      
      const defaultNotes = {
        'approve': 'Application approved for housing placement.',
        'reject': 'Application does not meet current requirements.',
        'review': 'Application is under review.'
      }
      
      await updateApplicationStatus(
        applicationId, 
        statusMap[actionType],
        notes || defaultNotes[actionType]
      )
      
      const messages = {
        'approve': '✅ Application approved successfully!',
        'reject': '❌ Application rejected.',
        'review': '👀 Application marked for review.'
      }
      
      toast({
        title: 'Application Updated',
        description: messages[actionType],
        variant: actionType === 'approve' ? 'default' : 'default'
      })
      
      setDialogOpen(false)
      router.refresh()
      
      // Force a hard refresh to ensure UI updates
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error: any) {
      console.error('Error updating application:', error)
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update application status.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }
  
  // Don't show actions for final statuses
  if (['approved', 'rejected', 'withdrawn'].includes(currentStatus)) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">
          This application has been {currentStatus}.
        </p>
      </div>
    )
  }
  
  return (
    <>
      <div className="space-y-2">
        {currentStatus === 'submitted' && (
          <>
            <Button
              onClick={() => handleAction('review')}
              variant="outline"
              className="w-full"
              disabled={isUpdating}
            >
              <Clock className="h-4 w-4 mr-2" />
              Mark for Review
            </Button>
            
            <Button
              onClick={() => handleAction('approve')}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isUpdating}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Application
            </Button>
            
            <Button
              onClick={() => handleAction('reject')}
              variant="destructive"
              className="w-full"
              disabled={isUpdating}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Application
            </Button>
          </>
        )}
        
        {currentStatus === 'under_review' && (
          <>
            <Button
              onClick={() => handleAction('approve')}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isUpdating}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Application
            </Button>
            
            <Button
              onClick={() => handleAction('reject')}
              variant="destructive"
              className="w-full"
              disabled={isUpdating}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Application
            </Button>
          </>
        )}
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Application'}
              {actionType === 'reject' && 'Reject Application'}
              {actionType === 'review' && 'Mark for Review'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'Are you sure you want to approve this application? The applicant will be notified of the decision.'}
              {actionType === 'reject' && 'Are you sure you want to reject this application? This action cannot be undone.'}
              {actionType === 'review' && 'Mark this application for further review. You can add notes for other reviewers.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  actionType === 'approve' 
                    ? "Add any approval notes or next steps..."
                    : actionType === 'reject'
                    ? "Provide a reason for rejection..."
                    : "Add notes for other reviewers..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={isUpdating}
              className={
                actionType === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700'
                  : actionType === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === 'approve' && <CheckCircle className="h-4 w-4 mr-2" />}
                  {actionType === 'reject' && <XCircle className="h-4 w-4 mr-2" />}
                  {actionType === 'review' && <Clock className="h-4 w-4 mr-2" />}
                  Confirm {actionType === 'approve' ? 'Approval' : actionType === 'reject' ? 'Rejection' : 'Review'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}