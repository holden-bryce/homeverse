'use client'

import { useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { X, Bell, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { useWebSocket, NotificationData } from '@/lib/websocket'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from './button'
import { ScrollArea } from './scroll-area'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface NotificationDropdownProps {
  onClose: () => void
}

const notificationIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  application_status: Bell,
  new_opportunity: Bell,
  document_request: AlertCircle,
  eligibility_result: Info
}

const priorityColors = {
  low: 'text-gray-600',
  normal: 'text-gray-800',
  high: 'text-orange-600',
  urgent: 'text-red-600'
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { notifications: wsNotifications, markAsRead } = useWebSocket()
  
  // Notification hooks
  const { data: apiData } = useQuery({
    queryKey: ['notifications', { limit: 20 }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      
      const unread_count = data?.filter(n => n.status === 'unread').length || 0
      return {
        notifications: data || [],
        unread_count,
        total: data?.length || 0
      }
    }
  })
  
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read', read: true })
        .eq('id', notificationId)
      
      if (error) throw error
      return { message: 'Notification marked as read' }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })
  
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ status: 'read', read: true })
        .eq('status', 'unread')
        .select()
      
      if (error) throw error
      return { message: 'All notifications marked as read', updated_count: data?.length || 0 }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  // Combine WebSocket and API notifications
  const allNotifications = [
    ...wsNotifications,
    ...(apiData?.notifications || [])
  ].filter((notification, index, self) => 
    index === self.findIndex(n => n.id === notification.id)
  ).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleMarkAsRead = async (notification: NotificationData) => {
    // Mark in WebSocket
    markAsRead(notification.id)
    
    // Mark in API
    await markReadMutation.mutateAsync(notification.id)
  }

  const handleMarkAllAsRead = async () => {
    await markAllReadMutation.mutateAsync()
    onClose()
  }

  const getNotificationIcon = (type: string) => {
    const Icon = notificationIcons[type as keyof typeof notificationIcons] || Bell
    return Icon
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-96 bg-background border rounded-lg shadow-lg z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">Notifications</h3>
        <div className="flex items-center gap-2">
          {allNotifications.some((n: any) => !n.read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications list */}
      <ScrollArea className="h-[400px]">
        {allNotifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {allNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              const isUnread = notification.status === 'unread' || !notification.read
              
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                    isUnread && "bg-muted/20"
                  )}
                  onClick={() => isUnread && handleMarkAsRead(notification)}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "flex-shrink-0 mt-1",
                      priorityColors[notification.priority as keyof typeof priorityColors]
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                          "font-medium text-sm",
                          priorityColors[notification.priority as keyof typeof priorityColors]
                        )}>
                          {notification.title}
                        </h4>
                        {isUnread && (
                          <span className="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full mt-1.5" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        
                        {notification.action_url && (
                          <Link
                            href={notification.action_url}
                            className="text-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View details
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t">
        <Link href="/dashboard/settings?tab=notifications">
          <Button variant="ghost" className="w-full justify-center" size="sm">
            Notification Settings
          </Button>
        </Link>
      </div>
    </div>
  )
}