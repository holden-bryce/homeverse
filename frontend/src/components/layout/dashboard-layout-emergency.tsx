'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Users, 
  FileText, 
  BarChart3, 
  Map, 
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  User,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/logo'
import { NotificationBell } from '@/components/ui/notification-bell'

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  roles?: string[]
}

const navigation: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/dashboard',
    icon: <Home className="h-5 w-5" />,
  },
  {
    id: 'applicants',
    label: 'Applicants',
    href: '/dashboard/applicants',
    icon: <Users className="h-5 w-5" />,
    roles: ['admin', 'manager', 'developer'],
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/dashboard/projects',
    icon: <Building2 className="h-5 w-5" />,
    roles: ['admin', 'manager', 'developer'],
  },
  {
    id: 'lenders',
    label: 'Lenders',
    href: '/dashboard/lenders',
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ['admin', 'manager', 'lender'],
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/dashboard/lenders/reports',
    icon: <FileText className="h-5 w-5" />,
    roles: ['admin', 'manager', 'lender'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/dashboard/lenders/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ['admin', 'manager', 'lender'],
  },
  {
    id: 'housing-search',
    label: 'Find Housing',
    href: '/dashboard/buyers',
    icon: <Search className="h-5 w-5" />,
    roles: ['applicant', 'buyer'],
  },
  {
    id: 'my-applications',
    label: 'My Applications',
    href: '/dashboard/buyers/applications',
    icon: <FileText className="h-5 w-5" />,
    roles: ['admin', 'applicant', 'buyer'],
  },
  {
    id: 'preferences',
    label: 'Preferences',
    href: '/dashboard/buyers/preferences',
    icon: <Settings className="h-5 w-5" />,
    roles: ['admin', 'applicant', 'buyer'],
  },
  {
    id: 'map',
    label: 'Map View',
    href: '/dashboard/map',
    icon: <Map className="h-5 w-5" />,
    roles: ['admin', 'manager', 'lender'],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="h-5 w-5" />,
    roles: ['admin'],
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Simple email to role mapping - no external dependencies
const EMAIL_ROLE_MAP: Record<string, string> = {
  'admin@test.com': 'admin',
  'developer@test.com': 'developer',
  'lender@test.com': 'lender',
  'buyer@test.com': 'buyer',
  'applicant@test.com': 'applicant'
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Single useEffect to handle all auth logic
  useEffect(() => {
    let mounted = true
    
    const checkAuth = async () => {
      console.log('Emergency Dashboard: Starting auth check...')
      
      try {
        // Check if we're in browser
        if (typeof window === 'undefined') {
          return
        }

        // Try to get Supabase session
        const { supabase } = await import('@/lib/supabase')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('Emergency Dashboard: Session check result:', {
          hasSession: !!session,
          userEmail: session?.user?.email,
          error: error?.message
        })

        if (error) {
          console.error('Emergency Dashboard: Session error:', error)
          if (mounted) {
            setLoading(false)
            setAuthChecked(true)
            // Redirect to login on error
            router.replace('/auth/login')
          }
          return
        }

        if (session?.user) {
          console.log('Emergency Dashboard: User found, setting up...')
          if (mounted) {
            setUser(session.user)
            setLoading(false)
            setAuthChecked(true)
          }
        } else {
          console.log('Emergency Dashboard: No session, redirecting to login...')
          if (mounted) {
            setLoading(false)
            setAuthChecked(true)
            router.replace('/auth/login')
          }
        }
      } catch (error) {
        console.error('Emergency Dashboard: Auth check error:', error)
        if (mounted) {
          setLoading(false)
          setAuthChecked(true)
          router.replace('/auth/login')
        }
      }
    }

    // Only run once
    if (!authChecked) {
      checkAuth()
    }

    return () => {
      mounted = false
    }
  }, [authChecked, router])

  // Show loading only while we're checking auth
  if (loading || !authChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
          <p className="mt-2 text-xs text-gray-500">Emergency Dashboard</p>
        </div>
      </div>
    )
  }

  // If no user after auth check, we should have been redirected
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Determine role
  const userRole = EMAIL_ROLE_MAP[user.email || ''] || 'user'
  
  // Filter navigation
  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(userRole)
  )

  console.log('Emergency Dashboard: Rendering with user:', {
    email: user.email,
    role: userRole,
    navItems: filteredNavigation.length
  })

  const handleLogout = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/auth/login'
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0'
        }`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition ease-in-out duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <Sidebar 
            navigation={filteredNavigation} 
            currentPath={pathname}
            user={user}
            onLogout={handleLogout}
            role={userRole}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar 
            navigation={filteredNavigation} 
            currentPath={pathname}
            user={user}
            onLogout={handleLogout}
            role={userRole}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex max-w-md">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Search className="h-5 w-5" />
                  </div>
                  <Input
                    className="pl-10 pr-3 py-2 border-transparent bg-gray-50 focus:bg-white focus:border-teal-500"
                    placeholder="Search..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-2 sm:space-x-4">
              <NotificationBell />
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      Default Company
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}

interface SidebarProps {
  navigation: NavItem[]
  currentPath: string
  user: any
  onLogout: () => void
  role: string
}

function Sidebar({ navigation, currentPath, user, onLogout, role }: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
        <Logo href="/dashboard" size="md" variant="full" />
      </div>

      {/* Company info */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-900">Default Company</div>
        <div className="flex items-center space-x-2 mt-1">
          <Badge variant="outline">trial</Badge>
          <span className="text-xs text-gray-500">100 seats</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = currentPath === item.href || 
            (item.href !== '/dashboard' && currentPath.startsWith(item.href))
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`mr-3 flex-shrink-0 h-5 w-5 ${
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
              }`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User menu */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {user.email}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {role}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 justify-start"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}