'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { NotificationDropdown } from './notification-dropdown'
import { useWebSocket } from '@/lib/websocket'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount, isConnected } = useWebSocket()

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Connection status indicator */}
        <span
          className={cn(
            "absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-background",
            isConnected ? "bg-green-500" : "bg-gray-400"
          )}
          title={isConnected ? "Connected" : "Disconnected"}
        />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}