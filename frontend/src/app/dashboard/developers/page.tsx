'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building2, 
  Users, 
  TrendingUp,
  Calendar,
  MapPin,
  DollarSign,
  Target,
  Clock,
  Plus,
  Eye,
  Edit,
  BarChart3,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { AreaChart } from '@/components/charts/area-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { BarChart } from '@/components/charts/bar-chart'

// Mock data - in real app this would come from API
const stats = [
  {
    title: 'Active Projects',
    value: '12',
    change: '+2 this month',
    icon: Building2,
    color: 'text-sage-600 bg-sage-100'
  },
  {
    title: 'Total Units',
    value: '1,847',
    change: '+156 this quarter',
    icon: Users,
    color: 'text-teal-600 bg-teal-100'
  },
  {
    title: 'Units Leased',
    value: '1,234',
    change: '67% occupancy',
    icon: TrendingUp,
    color: 'text-green-600 bg-green-100'
  },
  {
    title: 'Pipeline Value',
    value: '$240M',
    change: '+$45M this year',
    icon: DollarSign,
    color: 'text-amber-600 bg-amber-100'
  }
]

const recentProjects = [
  {
    id: '1',
    name: 'Sunset Gardens',
    status: 'active',
    unit_count: 120,
    ami_range: '30-80%',
    location: 'San Francisco, CA',
    completion: 75,
    units_leased: 90,
    est_delivery: '2024-12-15'
  },
  {
    id: '2',
    name: 'Riverside Commons',
    status: 'construction',
    unit_count: 85,
    ami_range: '50-120%',
    location: 'Oakland, CA',
    completion: 45,
    units_leased: 0,
    est_delivery: '2025-03-20'
  },
  {
    id: '3',
    name: 'Harbor View Apartments',
    status: 'planning',
    unit_count: 200,
    ami_range: '30-60%',
    location: 'San Jose, CA',
    completion: 15,
    units_leased: 0,
    est_delivery: '2025-08-30'
  }
]

const recentMatches = [
  {
    id: '1',
    applicant_name: 'Maria Rodriguez',
    project_name: 'Sunset Gardens',
    score: 94,
    status: 'contacted',
    ami_band: '60% AMI',
    household_size: 3
  },
  {
    id: '2',
    applicant_name: 'James Chen',
    project_name: 'Riverside Commons',
    score: 88,
    status: 'interested',
    ami_band: '80% AMI',
    household_size: 2
  },
  {
    id: '3',
    applicant_name: 'Sarah Johnson',
    project_name: 'Sunset Gardens',
    score: 92,
    status: 'pending',
    ami_band: '50% AMI',
    household_size: 4
  }
]

const occupancyData = [
  { name: 'Jan', value: 45 },
  { name: 'Feb', value: 52 },
  { name: 'Mar', value: 61 },
  { name: 'Apr', value: 67 },
  { name: 'May', value: 72 },
  { name: 'Jun', value: 75 }
]

const amiDistributionData = [
  { name: '30% AMI', value: 25, color: '#dc2626' },
  { name: '50% AMI', value: 35, color: '#ea580c' },
  { name: '60% AMI', value: 20, color: '#d97706' },
  { name: '80% AMI', value: 15, color: '#ca8a04' },
  { name: '100% AMI', value: 5, color: '#65a30d' }
]

const projectStatusData = [
  { name: 'Planning', value: 3 },
  { name: 'Construction', value: 5 },
  { name: 'Marketing', value: 2 },
  { name: 'Active', value: 2 }
]

export default function DevelopersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'construction':
        return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'planning':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'marketing':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'contacted':
        return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'interested':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Developers Portal</h1>
            <p className="text-gray-600 mt-1">
              Manage your housing development projects and find qualified applicants
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/dashboard/applications">
              <Button variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full px-6">
                <FileText className="mr-2 h-4 w-4" />
                View Applications
              </Button>
            </Link>
            <Link href="/dashboard/projects/new">
              <Button className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-6">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm rounded-full border-0 shadow-lg">
            <TabsTrigger value="overview" className="rounded-full">Overview</TabsTrigger>
            <TabsTrigger value="projects" className="rounded-full">Projects</TabsTrigger>
            <TabsTrigger value="matching" className="rounded-full">Matching</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-full">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Projects</span>
                    <Link href="/dashboard/projects">
                      <Button variant="ghost" size="sm" className="rounded-full">
                        View All
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    Latest updates on your development projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{project.name}</h4>
                        <Badge className={`${getStatusColor(project.status)} rounded-full border capitalize`}>
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {project.location}
                        <span className="mx-2">•</span>
                        <Users className="h-4 w-4 mr-1" />
                        {project.unit_count} units
                        <span className="mx-2">•</span>
                        {project.ami_range} AMI
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-sage-500 h-2 rounded-full" 
                              style={{ width: `${project.completion}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{project.completion}%</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className="rounded-full p-2" onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-full p-2" onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Occupancy Trend */}
              <div className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg">
                <AreaChart 
                  title="Occupancy Trend"
                  description="Monthly occupancy rates across all active projects"
                  data={occupancyData}
                  dataKey="value"
                  xAxisKey="name"
                  height={200}
                  color="#6b8e3a"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg">
                <BarChart 
                  title="Project Status Distribution"
                  description="Overview of projects by development stage"
                  data={projectStatusData}
                  dataKey="value"
                  xAxisKey="name"
                  height={250}
                  color="#6b8e3a"
                />
              </div>

              <div className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg">
                <PieChart 
                  title="AMI Distribution"
                  description="Affordable housing targets across portfolio"
                  data={amiDistributionData}
                  height={250}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="matching" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Matches</span>
                  <Link href="/dashboard/developers/matching">
                    <Button variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full">
                      <Target className="mr-2 h-4 w-4" />
                      Run Matching
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription>
                  AI-generated matches between applicants and your projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentMatches.map((match) => (
                  <div key={match.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-sage-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{match.applicant_name}</h4>
                          <p className="text-sm text-gray-500">{match.project_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-sage-600">{match.score}% match</div>
                          <Badge className={`${getMatchStatusColor(match.status)} rounded-full border capitalize text-xs`}>
                            {match.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>{match.ami_band}</span>
                      <span className="mx-2">•</span>
                      <span>{match.household_size} person household</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Key performance indicators for your projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">Leasing Velocity</p>
                        <p className="text-sm text-green-600">Units/month</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-800">23</p>
                      <p className="text-sm text-green-600">+15% vs target</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-6 w-6 text-teal-600" />
                      <div>
                        <p className="font-semibold text-teal-800">Avg. Time to Lease</p>
                        <p className="text-sm text-teal-600">Days on market</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-teal-800">45</p>
                      <p className="text-sm text-teal-600">-8 days vs avg</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-6 w-6 text-amber-600" />
                      <div>
                        <p className="font-semibold text-amber-800">Construction Delays</p>
                        <p className="text-sm text-amber-600">Projects affected</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-800">2</p>
                      <p className="text-sm text-amber-600">Avg. 3 week delay</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Upcoming Milestones</CardTitle>
                  <CardDescription>
                    Important dates and deadlines
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <Calendar className="h-5 w-5 text-sage-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Sunset Gardens Completion</p>
                        <p className="text-sm text-gray-500">December 15, 2024</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border border-green-200">
                        On Track
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <Calendar className="h-5 w-5 text-teal-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Riverside Commons Marketing</p>
                        <p className="text-sm text-gray-500">January 20, 2025</p>
                      </div>
                      <Badge className="bg-teal-100 text-teal-800 border border-teal-200">
                        Upcoming
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <Calendar className="h-5 w-5 text-amber-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Harbor View Permits</p>
                        <p className="text-sm text-gray-500">March 1, 2025</p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
                        At Risk
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}