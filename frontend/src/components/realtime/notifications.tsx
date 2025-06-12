'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Bell } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import type { Database } from '@/types/database'

type Notification = Database['public']['Tables']['notifications']['Row']

interface RealtimeNotificationsProps {
  userId: string
  initialCount?: number
}

export function RealtimeNotifications({ userId, initialCount = 0 }: RealtimeNotificationsProps) {
  const [notificationCount, setNotificationCount] = useState(initialCount)
  const [notifications, setNotifications] = useState<Notification[]>([])
  
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          
          // Show toast notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          })
          
          // Update notification count
          setNotificationCount(prev => prev + 1)
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev])
        }
      )
      .subscribe()
    
    // Load unread notifications count
    const loadNotifications = async () => {
      const { data, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (data) {
        setNotifications(data)
        setNotificationCount(count || 0)
      }
    }
    
    loadNotifications()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
  
  return (
    <div className="relative">
      <button className="relative p-2 text-gray-600 hover:text-gray-900">
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>
    </div>
  )
}