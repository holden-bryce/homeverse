'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Bell,
  ExternalLink,
  Calendar,
  User,
  FileText,
  Building2,
  DollarSign
} from 'lucide-react'
import { useActivityDetail } from '@/lib/api/hooks'
import { formatCurrency } from '@/lib/utils'

interface ActivityDetailModalProps {
  activityId: string | null
  isOpen: boolean
  onClose: () => void
}

export function ActivityDetailModal({ activityId, isOpen, onClose }: ActivityDetailModalProps) {
  const router = useRouter()
  const { data: activity, isLoading } = useActivityDetail(activityId || '')

  if (!activityId || !activity) return null

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'investment':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'application':
        return <AlertCircle className="h-5 w-5 text-teal-600" />
      case 'project':
        return <CheckCircle className="h-5 w-5 text-sage-600" />
      case 'compliance':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'applicant':
        return <User className="h-5 w-5 text-purple-600" />
      case 'auth':
        return <User className="h-5 w-5 text-gray-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-teal-100 text-teal-800'
    }
  }

  const navigateToEntity = () => {
    if (!activity.entity_type || !activity.entity_id) return

    switch (activity.entity_type) {
      case 'project':
        router.push(`/dashboard/projects/${activity.entity_id}`)
        break
      case 'applicant':
        router.push(`/dashboard/applicants/${activity.entity_id}`)
        break
      case 'investment':
        router.push(`/dashboard/lenders/investments/${activity.entity_id}`)
        break
      case 'report':
        router.push(`/dashboard/lenders/reports`)
        break
      default:
        break
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activity Details">
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {activity.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
              </div>
            </div>
            {activity.status && (
              <Badge className={`${getStatusColor(activity.status)} rounded-full border-0`}>
                {activity.status}
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(activity.created_at).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>
                {activity.user_email}
              </span>
            </div>

            {activity.type === 'investment' && activity.metadata?.amount && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span>
                  Investment Amount: {formatCurrency(activity.metadata.amount)}
                </span>
              </div>
            )}

            {activity.entity_type && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 capitalize">
                <FileText className="h-4 w-4" />
                <span>
                  Related {activity.entity_type}
                </span>
              </div>
            )}
          </div>

          {/* Metadata */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700">Additional Details</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(activity.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {activity.entity_type && activity.entity_id && (
              <Button 
                onClick={navigateToEntity}
                className="bg-sage-600 hover:bg-sage-700 text-white"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Related {activity.entity_type}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}