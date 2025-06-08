'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both'
}

export function ScrollArea({
  className,
  children,
  orientation = 'vertical',
  ...props
}: ScrollAreaProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full rounded-[inherit]",
          orientation === 'vertical' && "overflow-y-auto overflow-x-hidden",
          orientation === 'horizontal' && "overflow-x-auto overflow-y-hidden",
          orientation === 'both' && "overflow-auto",
          // Custom scrollbar styles
          "[&::-webkit-scrollbar]:w-2",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:bg-border",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/50"
        )}
      >
        {children}
      </div>
    </div>
  )
}