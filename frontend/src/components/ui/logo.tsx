'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon' | 'text'
  href?: string
  showText?: boolean
}

const sizeClasses = {
  sm: 'h-20 w-auto',
  md: 'h-28 w-auto', 
  lg: 'h-40 w-auto',
  xl: 'h-56 w-auto'
}

const iconSizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12', 
  xl: 'h-16 w-16'
}

export function Logo({ 
  className = '',
  size = 'md',
  variant = 'full',
  href,
  showText = true
}: LogoProps) {
  const LogoIcon = ({ className: iconClassName }: { className?: string }) => (
    <div className={cn("rounded-full bg-teal-500 flex items-center justify-center", iconClassName)}>
      <svg viewBox="0 0 24 24" className="w-2/3 h-2/3 text-white fill-current">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    </div>
  )

  const LogoText = ({ className: textClassName }: { className?: string }) => {
    const isWhite = textClassName?.includes('text-white')
    return (
      <div className={cn("font-bold text-xl", textClassName)}>
        <span className={isWhite ? "text-white" : "text-teal-600"}>Home</span>
        <span className={isWhite ? "text-gray-300" : "text-taupe-500"}>Verse</span>
      </div>
    )
  }

  const LogoContent = () => {
    if (variant === 'icon') {
      return <LogoIcon className={iconSizeClasses[size]} />
    }
    
    if (variant === 'text') {
      return <LogoText className={cn(`text-${size === 'sm' ? 'lg' : size === 'md' ? 'xl' : size === 'lg' ? '2xl' : '3xl'}`, className)} />
    }
    
    if (variant === 'full') {
      return (
        <div className="flex items-center space-x-3">
          <Image
            src="/homeverse-logo-new.png"
            alt="HomeVerse"
            width={size === 'sm' ? 250 : size === 'md' ? 350 : size === 'lg' ? 500 : 700}
            height={size === 'sm' ? 80 : size === 'md' ? 112 : size === 'lg' ? 160 : 224}
            className={cn(sizeClasses[size], className)}
            priority
          />
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-3">
        <LogoIcon className={iconSizeClasses[size]} />
        {showText && <LogoText className={cn(`text-${size === 'sm' ? 'lg' : size === 'md' ? 'xl' : size === 'lg' ? '2xl' : '3xl'}`, className)} />}
      </div>
    )
  }

  if (href) {
    return (
      <Link href={href} className={cn("flex items-center", className)}>
        <LogoContent />
      </Link>
    )
  }

  return (
    <div className={cn("flex items-center", className)}>
      <LogoContent />
    </div>
  )
}