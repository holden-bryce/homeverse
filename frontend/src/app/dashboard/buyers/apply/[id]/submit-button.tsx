'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'

export function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit"
      disabled={pending}
      className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-8"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Submit Application
        </>
      )}
    </Button>
  )
}