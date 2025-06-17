'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityDetailModal } from '@/components/ui/activity-modal'
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Building2,
  BarChart3,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Loader2,
  Filter,
  Search,
  Eye,
  ExternalLink,
  Calendar,
  MapPin,
  Percent,
  PieChart,
  TrendingDown,
  Activity
} from 'lucide-react'
import { useActivities } from '@/lib/supabase/hooks'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { 
  MetricCard, 
  ChartCard, 
  QuickActions, 
  StatusIndicator, 
  ProgressBar, 
  ActivityFeed, 
  DataTable,
  SimpleLineChart,
  SimpleAreaChart,
  SimpleBarChart
} from '@/components/layout/enhanced-dashboard'

// Fallback mock data for development
const mockPortfolioStats = [
  {
    title: 'Total Portfolio Value',
    value: '$2.4B',
    change: '+12.5%',
    trend: 'up' as const,
    icon: DollarSign,
  },
  {
    title: 'Active Investments',
    value: '156',
    change: '+8.2%',
    trend: 'up' as const,
    icon: Building2,
  },
  {
    title: 'CRA Compliance',
    value: '99.2%',
    change: '+0.3%',
    trend: 'up' as const,
    icon: Shield,
  },
  {
    title: 'ROI Average',
    value: '8.7%',
    change: '+1.2%',
    trend: 'up' as const,
    icon: TrendingUp,
  },
]

const mockInvestments = [
  {
    id: '1',
    project_name: 'Sunset Gardens',
    investment_amount: 25000000,
    investment_date: '2024-01-15',
    expected_roi: 8.5,
    current_performance: 9.2,
    status: 'performing',
    cra_qualified: true,
    ami_target: '50-80%',
    location: 'San Francisco, CA',
  },
  {
    id: '2',
    project_name: 'Riverside Commons',
    investment_amount: 18500000,
    investment_date: '2024-02-01',
    expected_roi: 7.8,
    current_performance: 7.9,
    status: 'performing',
    cra_qualified: true,
    ami_target: '30-60%',
    location: 'Oakland, CA',
  },
  {
    id: '3',
    project_name: 'Harbor View Apartments',
    investment_amount: 42000000,
    investment_date: '2024-02-10',
    expected_roi: 9.1,
    current_performance: 8.8,
    status: 'underperforming',
    cra_qualified: true,
    ami_target: '30-80%',
    location: 'San Jose, CA',
  },
]

const mockCRAMetrics = [
  {
    category: 'Low-Income Housing',
    target: 75,
    current: 82,
    status: 'exceeds',
  },
  {
    category: 'Community Development',
    target: 60,
    current: 58,
    status: 'approaching',
  },
  {
    category: 'Small Business Lending',
    target: 40,
    current: 45,
    status: 'exceeds',
  },
  {
    category: 'Geographic Distribution',
    target: 80,
    current: 77,
    status: 'approaching',
  },
]

const mockUpcomingReports = [
  {
    id: '1',
    title: 'Q3 CRA Performance Report',
    due_date: '2024-03-15',
    status: 'in_progress',
    completeness: 85,
  },
  {
    id: '2',
    title: 'Annual Affordable Housing Summary',
    due_date: '2024-04-01',
    status: 'not_started',
    completeness: 0,
  },
  {
    id: '3',
    title: 'Community Investment Analysis',
    due_date: '2024-03-30',
    status: 'review',
    completeness: 100,
  },
]

const mockPerformanceData = [
  { month: 'Jan', roi: 8.2, investments: 15, value: 250 },
  { month: 'Feb', roi: 8.5, investments: 18, value: 320 },
  { month: 'Mar', roi: 8.1, investments: 22, value: 410 },
  { month: 'Apr', roi: 8.7, investments: 25, value: 480 },
  { month: 'May', roi: 8.9, investments: 28, value: 550 },
  { month: 'Jun', roi: 9.1, investments: 32, value: 620 },
]

const mockActivityFeed = [
  {
    id: '1',
    type: 'investment' as const,
    title: 'New Investment: Harbor View Apartments',
    description: '$42M investment in affordable housing project',
    timestamp: '2024-03-15T10:30:00Z',
    status: 'success' as const
  },
  {
    id: '2',
    type: 'compliance' as const,
    title: 'CRA Compliance Updated',
    description: 'Low-income housing target exceeded by 7%',
    timestamp: '2024-03-14T15:45:00Z',
    status: 'success' as const
  },
  {
    id: '3',
    type: 'project' as const,
    title: 'Sunset Gardens Milestone',
    description: 'Construction phase completed ahead of schedule',
    timestamp: '2024-03-14T09:20:00Z',
    status: 'info' as const
  },
  {
    id: '4',
    type: 'notification' as const,
    title: 'Report Due Soon',
    description: 'Q3 CRA Performance Report due in 7 days',
    timestamp: '2024-03-13T11:15:00Z',
    status: 'warning' as const
  }
]

const mockMarketData = [
  { region: 'San Francisco', demand: 85, supply: 45, opportunity: 92 },
  { region: 'Oakland', demand: 78, supply: 52, opportunity: 88 },
  { region: 'San Jose', demand: 92, supply: 38, opportunity: 95 },
  { region: 'Berkeley', demand: 71, supply: 61, opportunity: 76 },
  { region: 'Fremont', demand: 68, supply: 55, opportunity: 82 },
]

export default function LendersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  
  // Custom hooks for lender-specific data
  const { data: portfolioStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['portfolio-stats'],
    queryFn: async () => {
      // For now, return mock data until we have the proper tables
      return {
        current_portfolio_value: 2400000,
        active_investments: 3,
        compliance_rate: 0.992,
        average_roi: 0.087,
        total_invested: 2200000,
        total_return: 200000,
        annualized_return: 0.091
      }
    }
  })
  
  const { data: investments = mockInvestments, isLoading: investmentsLoading } = useQuery({
    queryKey: ['investments', { limit: 5 }],
    queryFn: async () => mockInvestments // Use mock data for now
  })
  
  const { data: craMetrics = mockCRAMetrics, isLoading: craLoading } = useQuery({
    queryKey: ['cra-metrics'],
    queryFn: async () => mockCRAMetrics // Use mock data for now
  })
  
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', { type: 'cra', limit: 5 }],
    queryFn: async () => [] // Empty for now
  })
  
  const { data: activities = [], isLoading: activitiesLoading } = useActivities()
  
  // Transform API data to component format
  const portfolioStats = portfolioStatsData ? [
    {
      title: 'Total Portfolio Value',
      value: formatCurrency(portfolioStatsData.current_portfolio_value),
      change: '+12.5%', // TODO: Calculate from API
      trend: 'up' as const,
      icon: DollarSign,
    },
    {
      title: 'Active Investments',
      value: portfolioStatsData.active_investments.toString(),
      change: '+8.2%', // TODO: Calculate from API
      trend: 'up' as const,
      icon: Building2,
    },
    {
      title: 'CRA Compliance',
      value: formatPercentage(portfolioStatsData.compliance_rate),
      change: '+0.3%', // TODO: Calculate from API
      trend: 'up' as const,
      icon: Shield,
    },
    {
      title: 'ROI Average',
      value: formatPercentage(portfolioStatsData.average_roi),
      change: '+1.2%', // TODO: Calculate from API
      trend: 'up' as const,
      icon: TrendingUp,
    },
  ] : mockPortfolioStats
  
  const upcomingReports = reports && reports.length > 0 ? reports.map((report: any) => ({
    id: report.id,
    title: report.report_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) + ' Report',
    due_date: '2024-03-15', // TODO: Get from API
    status: report.status,
    completeness: report.status === 'completed' ? 100 : 
                  report.status === 'running' ? 50 : 0
  })) : mockUpcomingReports

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'performing':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'underperforming':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'at_risk':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'performing':
        return 'bg-sage-100 text-sage-800 border-sage-200'
      case 'underperforming':
        return 'bg-cream-100 text-cream-800 border-cream-200'
      case 'at_risk':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCRAStatusColor = (status: string) => {
    switch (status) {
      case 'exceeds':
        return 'text-green-600'
      case 'meets':
        return 'text-teal-600'
      case 'approaching':
        return 'text-yellow-600'
      case 'below':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  // Format activities for display
  const formattedActivities = activities.length > 0 ? activities.map(activity => ({
    id: activity.id,
    type: activity.type as 'investment' | 'application' | 'project' | 'compliance' | 'notification',
    title: activity.title,
    description: activity.description,
    timestamp: activity.created_at,
    status: activity.status as 'success' | 'warning' | 'error' | 'info' | undefined,
    entity_type: activity.entity_type,
    entity_id: activity.entity_id,
    metadata: activity.metadata
  })) : mockActivityFeed

  const handleActivityClick = (activity: any) => {
    setSelectedActivity(activity.id)
    setIsActivityModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lender Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Monitor investment performance and CRA compliance
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full">
              <Download className="mr-2 h-4 w-4" />
              Export Reports
            </Button>
            <Button className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-6">
              <FileText className="mr-2 h-4 w-4" />
              Generate CRA Report
            </Button>
          </div>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {portfolioStats.map((stat) => {
            const Icon = stat.icon
            return (
              <MetricCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                change={`${stat.change} from last quarter`}
                trend={stat.trend}
                icon={<Icon className="h-6 w-6 text-sage-600" />}
                loading={statsLoading}
              />
            )
          })}
        </div>

        {/* Quick Actions */}
        <QuickActions 
          actions={[
            {
              label: 'Generate CRA Report',
              icon: <FileText className="mr-2 h-4 w-4" />,
              onClick: () => router.push('/dashboard/lenders/reports'),
              variant: 'default'
            },
            {
              label: 'Export Portfolio Data',
              icon: <Download className="mr-2 h-4 w-4" />,
              onClick: () => {
                // Generate and download portfolio data
                const portfolioData = {
                  investments: mockInvestments,
                  stats: portfolioStats,
                  craMetrics: mockCRAMetrics,
                  exportedAt: new Date().toISOString(),
                  exportedBy: 'lender@test.com'
                }
                const blob = new Blob([JSON.stringify(portfolioData, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `portfolio-data-${new Date().toISOString().split('T')[0]}.json`
                a.click()
                URL.revokeObjectURL(url)
              },
              variant: 'outline'
            },
            {
              label: 'Market Analysis',
              icon: <BarChart3 className="mr-2 h-4 w-4" />,
              onClick: () => router.push('/dashboard/lenders/analytics'),
              variant: 'outline'
            },
            {
              label: 'Schedule Review',
              icon: <Calendar className="mr-2 h-4 w-4" />,
              onClick: () => {
                // Create a calendar event
                const startDate = new Date()
                startDate.setDate(startDate.getDate() + 7) // Next week
                const endDate = new Date(startDate)
                endDate.setHours(endDate.getHours() + 1)
                
                const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Portfolio Review Meeting&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=Quarterly portfolio review and performance assessment`
                window.open(calendarUrl, '_blank')
              },
              variant: 'outline'
            }
          ]}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-sage-100 rounded-full p-1">
            <TabsTrigger value="overview" className="rounded-full">Portfolio Overview</TabsTrigger>
            <TabsTrigger value="investments" className="rounded-full">Investments</TabsTrigger>
            <TabsTrigger value="cra" className="rounded-full">CRA Compliance</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-full">Reports</TabsTrigger>
          </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Performance Chart */}
            <ChartCard 
              title="Portfolio Performance Trend" 
              description="ROI and investment value over time"
              className="lg:col-span-2"
              actions={
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              }
            >
              <SimpleLineChart 
                data={mockPerformanceData}
                xKey="month"
                yKey="roi"
                color="#10b981"
              />
            </ChartCard>

            {/* Activity Feed */}
            <ChartCard 
              title="Recent Activity" 
              description="Latest updates and notifications"
              actions={
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard/activities')}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  View All
                </Button>
              }
            >
              <ActivityFeed 
                activities={formattedActivities} 
                maxItems={6} 
                onActivityClick={handleActivityClick}
              />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Investments */}
            <ChartCard 
              title="Top Performing Investments" 
              description="Your best performing projects"
            >
              <DataTable 
                columns={[
                  { key: 'project_name', label: 'Project', width: '40%' },
                  { key: 'location', label: 'Location', width: '35%' },
                  { 
                    key: 'current_performance', 
                    label: 'ROI', 
                    width: '25%',
                    render: (value) => (
                      <span className="font-medium text-green-600">
                        {value ? value.toFixed(1) : '0.0'}%
                      </span>
                    )
                  }
                ]}
                data={investments.slice(0, 3)}
                loading={investmentsLoading}
              />
            </ChartCard>

            {/* CRA Compliance Progress */}
            <ChartCard 
              title="CRA Compliance Status" 
              description="Progress toward compliance targets"
            >
              <div className="space-y-4">
                {craMetrics.map((metric: any) => (
                  <ProgressBar
                    key={metric.category}
                    value={metric.current}
                    max={metric.target}
                    label={metric.category}
                    color={
                      metric.current >= metric.target ? 'green' :
                      metric.current >= metric.target * 0.9 ? 'cream' : 'red'
                    }
                  />
                ))}
              </div>
            </ChartCard>
          </div>

          {/* Market Intelligence */}
          <ChartCard 
            title="Market Intelligence" 
            description="Regional market analysis and opportunities"
            actions={
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/lenders/analytics?tab=heatmap')}>
                <MapPin className="mr-2 h-4 w-4" />
                View Heatmap
              </Button>
            }
          >
            <SimpleBarChart 
              data={mockMarketData}
              xKey="region"
              yKey="opportunity"
              color="#10b981"
            />
          </ChartCard>
        </TabsContent>

        <TabsContent value="investments" className="space-y-6">
          <ChartCard 
            title="Investment Portfolio" 
            description="Detailed view of all investments and their performance"
            actions={
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            }
          >
            <DataTable 
              columns={[
                { 
                  key: 'project_name', 
                  label: 'Project', 
                  width: '25%',
                  render: (value, row) => (
                    <div>
                      <div className="font-semibold">{value}</div>
                      <div className="text-sm text-gray-500">{row.location}</div>
                    </div>
                  )
                },
                { 
                  key: 'investment_amount', 
                  label: 'Investment', 
                  width: '15%',
                  render: (value) => `$${value ? (value / 1000000).toFixed(1) : '0.0'}M`
                },
                { 
                  key: 'ami_target', 
                  label: 'AMI Target', 
                  width: '15%'
                },
                { 
                  key: 'expected_roi', 
                  label: 'Expected ROI', 
                  width: '15%',
                  render: (value) => `${value ? value.toFixed(1) : '0.0'}%`
                },
                { 
                  key: 'current_performance', 
                  label: 'Current ROI', 
                  width: '15%',
                  render: (value, row) => (
                    <span className={`font-medium ${
                      value >= row.expected_roi ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {value ? value.toFixed(1) : '0.0'}%
                    </span>
                  )
                },
                { 
                  key: 'status', 
                  label: 'Status', 
                  width: '15%',
                  render: (value, row) => (
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getStatusColor(value)} rounded-full border`}>
                        {value.replace('_', ' ')}
                      </Badge>
                      {row.cra_qualified && (
                        <Badge className="bg-teal-100 text-teal-800 border border-teal-200 rounded-full">
                          CRA
                        </Badge>
                      )}
                    </div>
                  )
                }
              ]}
              data={investments}
              loading={investmentsLoading}
            />
          </ChartCard>
        </TabsContent>

        <TabsContent value="cra" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CRA Performance Metrics */}
            <ChartCard 
              title="CRA Performance Metrics" 
              description="Track your Community Reinvestment Act compliance"
            >
              <div className="space-y-6">
                {craMetrics.map((metric: any) => (
                  <div key={metric.category} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{metric.category}</h4>
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{metric.target}%</span>
                      </div>
                    </div>
                    
                    <ProgressBar
                      value={metric.current}
                      max={100}
                      label=""
                      color={
                        metric.current >= metric.target ? 'green' :
                        metric.current >= metric.target * 0.9 ? 'cream' : 'red'
                      }
                      showPercentage={false}
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-bold ${getCRAStatusColor(metric.status)}`}>
                        {metric.current}%
                      </span>
                      <span className={`text-sm font-medium ${getCRAStatusColor(metric.status)}`}>
                        {(metric.current && metric.target && metric.current >= metric.target) ? 
                          `+${(metric.current - metric.target).toFixed(1)}% above target` :
                          (metric.current && metric.target) ? `${(metric.target - metric.current).toFixed(1)}% below target` : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Compliance Actions */}
            <ChartCard 
              title="Compliance Actions" 
              description="Recommended actions to maintain compliance"
            >
              <div className="space-y-4">
                <StatusIndicator
                  status="warning"
                  label="Community Development"
                  description="Need 2% more investment to meet target. Consider additional community development projects."
                />
                
                <StatusIndicator
                  status="success"
                  label="Low-Income Housing"
                  description="Exceeding target by 7%. Great job maintaining affordable housing investments."
                />
                
                <StatusIndicator
                  status="info"
                  label="Geographic Distribution"
                  description="Approaching target. Focus on underserved areas for next investments."
                />
              </div>
            </ChartCard>
          </div>

          {/* CRA Timeline Chart */}
          <ChartCard 
            title="CRA Compliance Trend" 
            description="Historical compliance performance over time"
            actions={
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            }
          >
            <SimpleAreaChart 
              data={[
                { month: 'Jan', compliance: 95 },
                { month: 'Feb', compliance: 96 },
                { month: 'Mar', compliance: 97 },
                { month: 'Apr', compliance: 98 },
                { month: 'May', compliance: 99 },
                { month: 'Jun', compliance: 99.2 },
              ]}
              xKey="month"
              yKey="compliance"
              color="#10b981"
            />
          </ChartCard>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ChartCard 
            title="Report Management" 
            description="Track the status of required compliance reports"
            actions={
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                <Button size="sm" className="bg-sage-600 hover:bg-sage-700">
                  <FileText className="mr-2 h-4 w-4" />
                  New Report
                </Button>
              </div>
            }
          >
            <DataTable 
              columns={[
                { 
                  key: 'title', 
                  label: 'Report', 
                  width: '40%',
                  render: (value, row) => (
                    <div>
                      <div className="font-semibold">{value}</div>
                      <div className="text-sm text-gray-500">
                        Due: {new Date(row.due_date).toLocaleDateString()}
                      </div>
                    </div>
                  )
                },
                { 
                  key: 'status', 
                  label: 'Status', 
                  width: '20%',
                  render: (value) => (
                    <Badge className={`${
                      value === 'review' ? 'bg-sage-100 text-sage-800 border-sage-200' :
                      value === 'in_progress' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    } rounded-full border`}>
                      {value.replace('_', ' ')}
                    </Badge>
                  )
                },
                { 
                  key: 'completeness', 
                  label: 'Progress', 
                  width: '25%',
                  render: (value) => (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">{value}%</span>
                      </div>
                      <ProgressBar 
                        value={value} 
                        max={100} 
                        label="" 
                        color="sage" 
                        showPercentage={false}
                      />
                    </div>
                  )
                },
                { 
                  key: 'actions', 
                  label: 'Actions', 
                  width: '15%',
                  render: (_, row) => (
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                }
              ]}
              data={upcomingReports.map(report => ({ ...report, actions: null }))}
              loading={reportsLoading}
            />
          </ChartCard>

          {/* Report Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard 
              title="Report Completion Trends" 
              description="Monthly report completion statistics"
            >
              <SimpleBarChart 
                data={[
                  { month: 'Jan', completed: 12, pending: 3 },
                  { month: 'Feb', completed: 15, pending: 2 },
                  { month: 'Mar', completed: 18, pending: 4 },
                  { month: 'Apr', completed: 14, pending: 1 },
                  { month: 'May', completed: 16, pending: 2 },
                  { month: 'Jun', completed: 19, pending: 3 },
                ]}
                xKey="month"
                yKey="completed"
                color="#10b981"
              />
            </ChartCard>

            <ChartCard 
              title="Compliance Health Score" 
              description="Overall compliance rating and recommendations"
            >
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-sage-600 mb-2">94.5</div>
                  <div className="text-lg text-gray-600">Compliance Score</div>
                  <Badge className="bg-sage-100 text-sage-800 border-sage-200 rounded-full mt-2">
                    Excellent
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <StatusIndicator
                    status="success"
                    label="On Track"
                    description="All quarterly reports submitted on time"
                  />
                  <StatusIndicator
                    status="info"
                    label="Recommendation"
                    description="Increase community development investments by 2%"
                  />
                </div>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
      </div>
      
      {/* Activity Detail Modal */}
      <ActivityDetailModal
        activityId={selectedActivity}
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false)
          setSelectedActivity(null)
        }}
      />
    </div>
  )
}