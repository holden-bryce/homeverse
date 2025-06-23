import { Suspense } from 'react'
import { getUserProfile } from '@/lib/auth/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Home, FileText, TrendingUp } from 'lucide-react'
import { cookies } from 'next/headers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getDashboardStats() {
  const cookieStore = cookies()
  const token = cookieStore.get('access_token')?.value

  try {
    // For now, return mock data until analytics endpoints are implemented
    return {
      applicants: { total: 12, pending: 5, approved: 7 },
      projects: { total: 8 },
      matches: { total: 24 }
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
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Activity feed coming soon...
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Quick actions coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}