'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
  Calendar,
  MapPin
} from 'lucide-react'
import { useCurrentUser } from '@/lib/supabase/hooks'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Mock data - in real app this would come from API
const stats = [
  {
    title: 'Total Applicants',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
  },
  {
    title: 'Active Projects',
    value: '156',
    change: '+8.2%',
    trend: 'up',
    icon: Building2,
  },
  {
    title: 'Match Rate',
    value: '78.3%',
    change: '+5.1%',
    trend: 'up',
    icon: TrendingUp,
  },
  {
    title: 'Total Investment',
    value: '$2.4M',
    change: '-2.3%',
    trend: 'down',
    icon: DollarSign,
  },
]

const recentActivity = [
  {
    id: 1,
    type: 'match',
    title: 'New matches generated',
    description: '15 new applicant-project matches created',
    time: '2 hours ago',
    status: 'success',
  },
  {
    id: 2,
    type: 'project',
    title: 'Project added',
    description: 'Sunset Gardens - 120 units added to portfolio',
    time: '4 hours ago',
    status: 'info',
  },
  {
    id: 3,
    type: 'report',
    title: 'CRA report generated',
    description: 'Q3 compliance report ready for review',
    time: '6 hours ago',
    status: 'success',
  },
  {
    id: 4,
    type: 'applicant',
    title: 'New applicants registered',
    description: '8 new applicants from waiting list',
    time: '1 day ago',
    status: 'info',
  },
]

const upcomingTasks = [
  {
    id: 1,
    title: 'Review pending matches',
    description: '24 matches need approval',
    priority: 'high',
    dueDate: 'Today',
  },
  {
    id: 2,
    title: 'Submit quarterly CRA report',
    description: 'Due to federal compliance office',
    priority: 'high',
    dueDate: 'Tomorrow',
  },
  {
    id: 3,
    title: 'Project site visit',
    description: 'Riverside Commons inspection',
    priority: 'medium',
    dueDate: 'This week',
  },
  {
    id: 4,
    title: 'Update AMI calculations',
    description: 'New HUD guidelines effective',
    priority: 'medium',
    dueDate: 'Next week',
  },
]

export default function DashboardPage() {
  const { data: user } = useCurrentUser()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {user?.email?.split('@')[0] || 'User'}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Here's what's happening with your housing portfolio today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/applicants">
              <Button className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-6">
                <Plus className="mr-2 h-4 w-4" />
                Add Applicant
              </Button>
            </Link>
            <Link href="/dashboard/projects">
              <Button variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full px-6">
                <Building2 className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ml-1 ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Recent Activity & Tasks */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="tasks">Upcoming Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates across your portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          activity.status === 'success' ? 'bg-green-100' : 'bg-teal-100'
                        }`}>
                          {activity.type === 'match' && <TrendingUp className="h-4 w-4 text-green-600" />}
                          {activity.type === 'project' && <Building2 className="h-4 w-4 text-teal-600" />}
                          {activity.type === 'report' && <FileText className="h-4 w-4 text-green-600" />}
                          {activity.type === 'applicant' && <Users className="h-4 w-4 text-teal-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <CardDescription>
                    Items that need your attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingTasks.map((task) => (
                      <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{task.title}</p>
                            <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{task.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{task.dueDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Quick Actions & Summary */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/dashboard/applicants" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Applicants
                  </Button>
                </Link>
                <Link href="/dashboard/projects" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="mr-2 h-4 w-4" />
                    View Projects
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/dashboard/lenders/reports')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/dashboard/map')}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Map View
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Summary</CardTitle>
              <CardDescription>
                Key metrics at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Matches</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Reviews</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Units Available</span>
                  <span className="font-medium">342</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Compliance Rate</span>
                  <span className="font-medium text-green-600">99.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  )
}