'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Map,
  FileText,
  Building2,
  PieChart,
  Target
} from 'lucide-react'

interface LendersNavItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  description: string
}

const lendersNavigation: LendersNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/dashboard/lenders',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Portfolio overview and key metrics'
  },
  {
    id: 'investments',
    label: 'Investments',
    href: '/dashboard/lenders/investments',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Manage and track investments'
  },
  {
    id: 'analytics',
    label: 'Market Intelligence',
    href: '/dashboard/lenders/analytics',
    icon: <Map className="h-5 w-5" />,
    description: 'Geographic and market analysis'
  },
  {
    id: 'reports',
    label: 'CRA Reports',
    href: '/dashboard/lenders/reports',
    icon: <FileText className="h-5 w-5" />,
    description: 'Compliance reporting and documentation'
  }
]

interface LendersLayoutProps {
  children: React.ReactNode
}

export default function LendersLayout({ children }: LendersLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      {/* Lenders Portal Navigation */}
      <div className="border-b border-sage-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Building2 className="h-6 w-6 mr-2 text-sage-600" />
                Lenders Portal
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Investment management and compliance monitoring
              </p>
            </div>
            <Badge className="bg-sage-100 text-sage-800 border-sage-200">
              Multi-Tenant CRA Platform
            </Badge>
          </div>

          {/* Lenders-specific navigation tabs */}
          <nav className="flex space-x-1">
            {lendersNavigation.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-sage-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-sage-100 hover:text-sage-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-sage-600'
                    }`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {item.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  )
}