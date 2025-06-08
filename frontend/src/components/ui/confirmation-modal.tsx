'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Modal, 
  ModalContent, 
  ModalOverlay 
} from '@/components/ui/modal'
import { AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  loading?: boolean
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconColor: 'text-red-600',
    iconBgColor: 'bg-red-100',
    confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    iconBgColor: 'bg-yellow-100',
    confirmButtonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  },
  info: {
    icon: Info,
    iconColor: 'text-teal-600',
    iconBgColor: 'bg-teal-100',
    confirmButtonClass: 'bg-teal-600 hover:bg-teal-700 text-white',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    iconBgColor: 'bg-green-100',
    confirmButtonClass: 'bg-green-600 hover:bg-green-700 text-white',
  },
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmationModalProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = () => {
    onConfirm()
    // Don't close modal here - let parent handle it after async operation
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalOverlay />
      <ModalContent className="p-6 max-w-md mx-auto">
        <div className="flex items-start space-x-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.iconBgColor} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {description}
            </p>
            
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2"
              >
                {cancelText}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className={`px-4 py-2 ${config.confirmButtonClass}`}
                loading={loading}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}

// Hook for easier usage
export function useConfirmationModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<{
    title: string
    description: string
    onConfirm: () => void
    variant?: 'danger' | 'warning' | 'info' | 'success'
    confirmText?: string
    cancelText?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const confirm = (options: {
    title: string
    description: string
    onConfirm: () => void | Promise<void>
    variant?: 'danger' | 'warning' | 'info' | 'success'
    confirmText?: string
    cancelText?: string
  }) => {
    setConfig({
      ...options,
      onConfirm: async () => {
        setLoading(true)
        try {
          await options.onConfirm()
          setIsOpen(false)
        } catch (error) {
          console.error('Confirmation action failed:', error)
          // Keep modal open so user can see the error
        } finally {
          setLoading(false)
        }
      },
    })
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setLoading(false)
    setConfig(null)
  }

  const ConfirmationModalComponent = config ? (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={close}
      onConfirm={config.onConfirm}
      title={config.title}
      description={config.description}
      variant={config.variant}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      loading={loading}
    />
  ) : null

  return {
    confirm,
    ConfirmationModal: ConfirmationModalComponent,
  }
}