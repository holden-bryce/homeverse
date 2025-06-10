// WebSocket connection management for real-time notifications
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export interface WebSocketMessage {
  type: 'notification' | 'activity' | 'connection' | 'pong'
  data?: any
  status?: string
  message?: string
}

export interface NotificationData {
  id: string
  type: string
  title: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  action_url?: string
  created_at: string
}

export const useWebSocket = () => {
  const { user } = useAuthStore()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const pingIntervalRef = useRef<NodeJS.Timeout>()
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const connect = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    
    if (!user || !token || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    const ws = new WebSocket(`${wsUrl}/ws/${user.id}?token=${token}`)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      
      // Start ping interval to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000) // Ping every 30 seconds
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        
        switch (message.type) {
          case 'notification':
            handleNewNotification(message.data)
            break
          case 'activity':
            // Handle activity updates if needed
            break
          case 'connection':
            console.log('Connection status:', message.status)
            break
          case 'pong':
            // Pong received, connection is alive
            break
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
      wsRef.current = null
      
      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
      }
      
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, 5000)
    }

    wsRef.current = ws
  }, [user])

  const handleNewNotification = (notification: NotificationData) => {
    // Add to notifications list
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)
    
    // Show toast notification
    if (notification.priority === 'urgent') {
      toast.error(notification.title, {
        duration: 6000,
        position: 'top-right'
      })
    } else {
      toast.success(notification.title, {
        duration: 4000,
        position: 'top-right'
      })
    }
    
    // Play notification sound if enabled
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.png',
        badge: '/favicon.png'
      })
    }
  }

  const markAsRead = useCallback((notificationId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }))
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    notifications,
    unreadCount,
    markAsRead
  }
}