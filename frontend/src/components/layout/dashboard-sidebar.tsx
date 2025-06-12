'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Home,
  MapPin,
  FileText,
  BarChart3,
  Settings,
  Building2,
  CreditCard,
  UserCircle,
  Activity
} from 'lucide-react'

interface DashboardSidebarProps {
  role: string
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname()
  
  const navigation = {
    admin: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Users', href: '/dashboard/users', icon: Users },
      { name: 'Companies', href: '/dashboard/companies', icon: Building2 },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
    developer: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projects', href: '/dashboard/projects', icon: Home },
      { name: 'Applicants', href: '/dashboard/applicants', icon: Users },
      { name: 'Matching', href: '/dashboard/developers/matching', icon: Activity },
      { name: 'Map', href: '/dashboard/map', icon: MapPin },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
    lender: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Investments', href: '/dashboard/lenders/investments', icon: CreditCard },
      { name: 'Analytics', href: '/dashboard/lenders/analytics', icon: BarChart3 },
      { name: 'Reports', href: '/dashboard/lenders/reports', icon: FileText },
      { name: 'Map', href: '/dashboard/map', icon: MapPin },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
    buyer: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Properties', href: '/dashboard/buyers/properties', icon: Home },
      { name: 'Applications', href: '/dashboard/buyers/applications', icon: FileText },
      { name: 'Preferences', href: '/dashboard/buyers/preferences', icon: UserCircle },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
    applicant: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Applications', href: '/dashboard/applicants', icon: FileText },
      { name: 'Profile', href: '/dashboard/profile', icon: UserCircle },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  }
  
  const navItems = navigation[role as keyof typeof navigation] || navigation.buyer
  
  return (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              group flex items-center px-2 py-2 text-sm font-medium rounded-md
              ${isActive
                ? 'bg-teal-100 text-teal-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <item.icon
              className={`
                mr-3 h-5 w-5 flex-shrink-0
                ${isActive
                  ? 'text-teal-600'
                  : 'text-gray-400 group-hover:text-gray-500'
                }
              `}
            />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}