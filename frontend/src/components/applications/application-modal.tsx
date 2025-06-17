'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { Calendar, FileText, Send, Loader2 } from 'lucide-react'
import { useCreateApplication } from '@/lib/supabase/hooks'

interface ApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  project: {
    id: string
    name: string
    developer?: string
    affordable_units?: number
    total_units?: number
  }
  applicant?: {
    id: string
    full_name: string
    email?: string
  }
}

export function ApplicationModal({ isOpen, onClose, project, applicant }: ApplicationModalProps) {
  const [formData, setFormData] = useState({
    preferred_move_in_date: '',
    additional_notes: ''
  })
  
  const createApplication = useCreateApplication()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!applicant) {
      toast({
        title: 'Error',
        description: 'You must be an applicant to submit applications.',
        variant: 'destructive'
      })
      return
    }

    try {
      await createApplication.mutateAsync({
        project_id: project.id,
        applicant_id: applicant.id,
        preferred_move_in_date: formData.preferred_move_in_date || null,
        additional_notes: formData.additional_notes || null,
        documents: []
      })

      toast({
        title: 'Application Submitted',
        description: `Your application for ${project.name} has been submitted successfully.`,
        variant: 'success'
      })

      // Reset form and close modal
      setFormData({
        preferred_move_in_date: '',
        additional_notes: ''
      })
      onClose()
    } catch (error) {
      console.error('Application submission error:', error)
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your application. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            Apply for {project.name}
          </DialogTitle>
          <DialogDescription>
            Submit your application for this affordable housing project. 
            {project.developer && ` Developed by ${project.developer}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Summary */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h4 className="font-medium text-teal-900 mb-2">Project Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-teal-700 font-medium">Total Units:</span>
                <span className="ml-2 text-teal-900">{project.total_units || 'N/A'}</span>
              </div>
              <div>
                <span className="text-teal-700 font-medium">Affordable Units:</span>
                <span className="ml-2 text-teal-900">{project.affordable_units || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Applicant Info */}
          {applicant && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Applicant Information</h4>
              <div className="text-sm">
                <p><span className="font-medium">Name:</span> {applicant.full_name}</p>
                {applicant.email && (
                  <p><span className="font-medium">Email:</span> {applicant.email}</p>
                )}
              </div>
            </div>
          )}

          {/* Application Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="move_in_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Preferred Move-In Date
              </Label>
              <Input
                id="move_in_date"
                type="date"
                value={formData.preferred_move_in_date}
                onChange={(e) => handleInputChange('preferred_move_in_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]} // Minimum date is today
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Select your ideal move-in date (optional)
              </p>
            </div>

            <div>
              <Label htmlFor="additional_notes">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="additional_notes"
                placeholder="Any additional information you'd like to include with your application..."
                value={formData.additional_notes}
                onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                rows={4}
                className="mt-1"
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 mt-1">
                {1000 - formData.additional_notes.length} characters remaining
              </p>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createApplication.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={createApplication.isPending}
            >
              {createApplication.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}