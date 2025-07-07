'use client'

import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

interface ApplicantDetailActionsProps {
  email: string
}

export function ApplicantDetailActions({ email }: ApplicantDetailActionsProps) {
  return (
    <Button
      variant="outline"
      onClick={() => window.open(`mailto:${email}`, '_blank')}
    >
      <Mail className="h-4 w-4 mr-2" />
      Send Email
    </Button>
  )
}