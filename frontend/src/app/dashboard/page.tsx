import { Suspense } from 'react'
import { getUserProfile } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Home, FileText, TrendingUp, Plus, Search, Calculator, Map, Building2, UserCheck, DollarSign, BarChart3, Settings, ArrowRight, Database } from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getDashboardStats() {
  const profile = await getUserProfile()
  if (!profile || !profile.company_id) {
    return {
      applicants: { total: 0, pending: 0, approved: 0 },
      projects: { total: 0 },
      matches: { total: 0 }
    }
  }

  const supabase = createClient()

  try {
    // Get real data from Supabase
    // Get applicants count
    const { count: totalApplicants } = await supabase
      .from('applicants')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', profile.company_id)

    // Get applicants by status
    const { count: pendingApplicants } = await supabase
      .from('applicants')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', profile.company_id)
      .eq('status', 'pending')

    const { count: approvedApplicants } = await supabase
      .from('applicants')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', profile.company_id)
      .eq('status', 'approved')

    // Get projects count
    const { count: totalProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', profile.company_id)

    // Get applications/matches count (if the table exists)
    let totalMatches = 0
    try {
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
      totalMatches = count || 0
    } catch (e) {
      // Table might not exist yet
      console.log('Applications table not found')
    }

    return {
      applicants: { 
        total: totalApplicants || 0, 
        pending: pendingApplicants || 0, 
        approved: approvedApplicants || 0 
      },
      projects: { total: totalProjects || 0 },
      matches: { total: totalMatches }
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      applicants: { total: 0, pending: 0, approved: 0 },
      projects: { total: 0 },
      matches: { total: 0 }
    }
  }
}

async function DashboardStats({ companyId }: { companyId: string }) {
  const data = await getDashboardStats()
  
  const stats = [
    {
      title: 'Total Applicants',
      value: data.applicants.total,
      description: `${data.applicants.pending} pending`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Projects',
      value: data.projects.total,
      description: 'Housing developments',
      icon: Home,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Approved Applications',
      value: data.applicants.approved,
      description: `${Math.round((data.applicants.approved / data.applicants.total) * 100) || 0}% approval rate`,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Matches',
      value: data.matches.total,
      description: 'AI-powered matches',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface Activity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  icon: any
  color: string
  bgColor: string
}

async function getRecentActivities(companyId: string): Promise<Activity[]> {
  const supabase = createClient()
  
  try {
    // Try to get activities from a generic audit log or system events
    // Since we don't have an activities table, we'll create a combined view from various tables
    const activities: Activity[] = []
    
    // Get recent applicants
    const { data: recentApplicants } = await supabase
      .from('applicants')
      .select('id, full_name, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (recentApplicants) {
      recentApplicants.forEach(applicant => {
        activities.push({
          id: `applicant-${applicant.id}`,
          type: 'applicant',
          title: 'New Applicant Added',
          description: `${applicant.full_name} was added to the system`,
          timestamp: applicant.created_at,
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        })
      })
    }
    
    // Get recent projects
    const { data: recentProjects } = await supabase
      .from('projects')
      .select('id, name, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(2)
    
    if (recentProjects) {
      recentProjects.forEach(project => {
        activities.push({
          id: `project-${project.id}`,
          type: 'project',
          title: 'New Project Created',
          description: `${project.name} was added`,
          timestamp: project.created_at,
          icon: Building2,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        })
      })
    }
    
    // Try to get recent applications - handle potential missing table
    try {
      const { data: recentApplications } = await supabase
        .from('applications')
        .select('id, created_at, status')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (recentApplications) {
        recentApplications.forEach((app: any) => {
          activities.push({
            id: `application-${app.id}`,
            type: 'application',
            title: 'New Application',
            description: `Application ${app.id.slice(-6)} was submitted`,
            timestamp: app.created_at,
            icon: FileText,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
          })
        })
      }
    } catch (error) {
      // Applications table might not exist, continue without it
      console.log('Could not fetch applications:', error)
    }
    
    // Sort by timestamp and take the most recent
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return []
  }
}

async function RecentActivity({ profile }: { profile: any }) {
  const activities = await getRecentActivities(profile.company_id)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest updates from your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${activity.bgColor} flex-shrink-0`}>
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1">Activities will appear here as you use the platform</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

async function QuickActions({ profile }: { profile: any }) {
  const role = profile.role || 'developer'
  
  // Define role-based quick actions
  const actionsByRole = {
    developer: [
      {
        title: 'Add New Project',
        description: 'Create a new housing development',
        icon: Plus,
        href: '/dashboard/projects/new',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      {
        title: 'View Applications',
        description: 'Review pending applications',
        icon: FileText,
        href: '/dashboard/applications',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Browse Applicants',
        description: 'Find qualified applicants',
        icon: Search,
        href: '/dashboard/applicants',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      },
      {
        title: 'View Analytics',
        description: 'Track project performance',
        icon: BarChart3,
        href: '/dashboard/analytics',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      }
    ],
    lender: [
      {
        title: 'New Investment',
        description: 'Browse investment opportunities',
        icon: DollarSign,
        href: '/dashboard/projects',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      {
        title: 'View Portfolio',
        description: 'Track your investments',
        icon: BarChart3,
        href: '/dashboard/portfolio',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'CRA Reports',
        description: 'Generate compliance reports',
        icon: FileText,
        href: '/dashboard/reports',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      },
      {
        title: 'Market Analysis',
        description: 'View market heatmaps',
        icon: Map,
        href: '/dashboard/map',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      }
    ],
    buyer: [
      {
        title: 'Browse Properties',
        description: 'Find available housing',
        icon: Search,
        href: '/dashboard/buyers',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Map View',
        description: 'Explore properties on map',
        icon: Map,
        href: '/dashboard/map',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      {
        title: 'My Applications',
        description: 'Track your applications',
        icon: FileText,
        href: '/dashboard/applications',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      },
      {
        title: 'Update Profile',
        description: 'Manage your preferences',
        icon: Settings,
        href: '/dashboard/settings',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      }
    ],
    applicant: [
      {
        title: 'Find Housing',
        description: 'Browse available units',
        icon: Search,
        href: '/dashboard/applicant-portal',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'My Applications',
        description: 'View application status',
        icon: FileText,
        href: '/dashboard/applications',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      {
        title: 'Update Profile',
        description: 'Keep information current',
        icon: UserCheck,
        href: '/dashboard/settings',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      },
      {
        title: 'Income Calculator',
        description: 'Check AMI eligibility',
        icon: Calculator,
        href: '/dashboard/calculator',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      }
    ],
    admin: [
      {
        title: 'Manage Users',
        description: 'User administration',
        icon: Users,
        href: '/dashboard/admin/users',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Company Settings',
        description: 'Configure organization',
        icon: Building2,
        href: '/dashboard/admin/company',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      {
        title: 'System Analytics',
        description: 'Platform statistics',
        icon: BarChart3,
        href: '/dashboard/analytics',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      },
      {
        title: 'View Reports',
        description: 'System reports',
        icon: FileText,
        href: '/dashboard/reports',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      },
      {
        title: 'Demo Data',
        description: 'Add sample data for demos',
        icon: Database,
        href: '/dashboard/demo',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100'
      }
    ]
  }
  
  const actions = actionsByRole[role as keyof typeof actionsByRole] || actionsByRole.developer
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant="outline"
                className="w-full justify-start p-4 h-auto hover:shadow-md transition-all group"
              >
                <div className="flex items-start space-x-3 w-full">
                  <div className={`p-2 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}>
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm text-gray-900 group-hover:text-gray-700">
                      {action.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const profile = await getUserProfile()
  
  if (!profile || !profile.company_id) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to HomeVerse</CardTitle>
            <CardDescription>
              Please contact your administrator to be assigned to a company.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {profile.full_name || 'User'}
        </p>
      </div>
      
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats companyId={profile.company_id} />
      </Suspense>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity profile={profile} />
        </Suspense>
        
        <Suspense fallback={<QuickActionsSkeleton />}>
          <QuickActions profile={profile} />
        </Suspense>
      </div>
    </div>
  )
}