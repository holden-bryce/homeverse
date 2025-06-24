'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalTrigger } from '@/components/ui/modal'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building2, 
  Percent,
  Calendar,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  BarChart3,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { BarChart } from '@/components/charts/bar-chart'
import { LineChart } from '@/components/charts/line-chart'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils/index'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { 
  useLenderInvestments,
  useLenderPortfolioStats
} from '@/lib/supabase/hooks'

// Fallback mock data for development
const mockInvestments = [
  {
    id: '1',
    project_name: 'Riverside Commons',
    developer: 'Urban Housing Partners',
    location: 'Oakland, CA',
    investment_amount: 2500000,
    date_invested: '2024-03-15',
    current_value: 2750000,
    roi: 10.0,
    status: 'active',
    ami_compliance: 95.2,
    units_funded: 48,
    completion_date: '2025-06-30',
    risk_level: 'low'
  },
  {
    id: '2', 
    project_name: 'Green Valley Apartments',
    developer: 'Sustainable Living Corp',
    location: 'Sacramento, CA',
    investment_amount: 1800000,
    date_invested: '2024-01-22',
    current_value: 1980000,
    roi: 10.0,
    status: 'active',
    ami_compliance: 88.7,
    units_funded: 32,
    completion_date: '2025-03-15',
    risk_level: 'medium'
  },
  {
    id: '3',
    project_name: 'Downtown Senior Housing',
    developer: 'Community First Development',
    location: 'San Jose, CA',
    investment_amount: 3200000,
    date_invested: '2023-11-08',
    current_value: 3520000,
    roi: 10.0,
    status: 'completed',
    ami_compliance: 92.8,
    units_funded: 64,
    completion_date: '2024-11-30',
    risk_level: 'low'
  }
]

const mockPortfolioStats = [
  {
    title: 'Total Invested',
    value: 7500000,
    change: 12.5,
    trend: 'up',
    icon: DollarSign,
  },
  {
    title: 'Current Portfolio Value',
    value: 8250000,
    change: 8.2,
    trend: 'up',
    icon: TrendingUp,
  },
  {
    title: 'Average ROI',
    value: 10.0,
    change: 2.1,
    trend: 'up',
    icon: Percent,
    isPercentage: true,
  },
  {
    title: 'Active Investments',
    value: 12,
    change: -5.5,
    trend: 'down',
    icon: Building2,
  }
]

const mockPerformanceData = [
  { name: 'Q1 2023', roi: 8.2, invested: 2100000 },
  { name: 'Q2 2023', roi: 9.1, invested: 2800000 },
  { name: 'Q3 2023', roi: 9.8, invested: 3200000 },
  { name: 'Q4 2023', roi: 10.2, invested: 4100000 },
  { name: 'Q1 2024', roi: 10.8, invested: 5500000 },
  { name: 'Q2 2024', roi: 10.5, invested: 7500000 },
]

const mockRiskDistribution = [
  { name: 'Low Risk', value: 45, color: '#10b981' },
  { name: 'Medium Risk', value: 35, color: '#f59e0b' },
  { name: 'High Risk', value: 20, color: '#ef4444' },
]

export default function InvestmentsPage() {
  const router = useRouter()
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null)
  
  // Use real data hooks
  const { data: investments = [], isLoading: investmentsLoading } = useLenderInvestments()
  const { data: portfolioStats, isLoading: statsLoading } = useLenderPortfolioStats()
  const performanceData = mockPerformanceData // TODO: Create performance data hook
  const performanceLoading = false
  
  // Transform portfolio stats to match component format
  const transformedStats = portfolioStats ? [
    {
      title: 'Total Invested',
      value: portfolioStats.total_invested,
      change: 12.5, // TODO: Calculate from API
      trend: 'up' as const,
      icon: DollarSign,
    },
    {
      title: 'Current Portfolio Value',
      value: portfolioStats.current_portfolio_value,
      change: 8.2, // TODO: Calculate from API
      trend: 'up' as const,
      icon: TrendingUp,
    },
    {
      title: 'Average ROI',
      value: portfolioStats.average_roi,
      change: 2.1, // TODO: Calculate from API
      trend: 'up' as const,
      icon: Percent,
      isPercentage: true,
    },
    {
      title: 'Active Investments',
      value: portfolioStats.active_investments,
      change: -5.5, // TODO: Calculate from API
      trend: 'down' as const,
      icon: Building2,
    }
  ] : mockPortfolioStats
  
  // Risk distribution calculation
  const riskDistribution = investments.length > 0 ? [
    { 
      name: 'Low Risk', 
      value: Math.round((investments.filter((inv: any) => (inv.risk_level || 'low') === 'low').length / investments.length) * 100),
      color: '#10b981'
    },
    { 
      name: 'Medium Risk', 
      value: Math.round((investments.filter((inv: any) => (inv.risk_level || 'low') === 'medium').length / investments.length) * 100),
      color: '#f59e0b'
    },
    { 
      name: 'High Risk', 
      value: Math.round((investments.filter((inv: any) => (inv.risk_level || 'low') === 'high').length / investments.length) * 100),
      color: '#ef4444'
    },
  ] : mockRiskDistribution

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-teal-100 text-teal-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investment Portfolio</h1>
          <p className="text-gray-600 mt-1">
            Track and manage your affordable housing investments
          </p>
        </div>
        <Button 
          className="bg-sage-600 hover:bg-sage-700"
          onClick={() => router.push('/dashboard/lenders/investments/new')}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Investment
        </Button>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          transformedStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.isPercentage 
                        ? formatPercentage(stat.value)
                        : typeof stat.value === 'number' && stat.value > 1000 
                        ? formatCurrency(stat.value)
                        : stat.value
                      }
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-sage-100 rounded-full flex items-center justify-center">
                    <Icon className="h-6 w-6 text-sage-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ml-1 ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(stat.change)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last quarter</span>
                </div>
              </CardContent>
            </Card>
          )
        })
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Investments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Performance Chart */}
            <div className="border-0 shadow-lg bg-white rounded-lg">
              {performanceLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
                </div>
              ) : (
                <LineChart 
                  title="Portfolio Performance"
                  description="ROI trends over time (%)"
                  data={performanceData.map((item: any) => ({ 
                    name: item.name, 
                    value: item.roi 
                  }))}
                  xAxisKey="name"
                  dataKey="value"
                  height={300}
                  color="#6b8e3a"
                />
              )}
            </div>

            {/* Investment Distribution */}
            <div className="border-0 shadow-lg bg-white rounded-lg">
              <BarChart 
                title="Risk Distribution"
                description="Portfolio allocation by risk level"
                data={riskDistribution}
                xAxisKey="name"
                dataKey="value"
                height={300}
                color="#6b8e3a"
              />
            </div>
          </div>

          {/* Recent Investments */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Investments</CardTitle>
              <CardDescription>Latest investment activity</CardDescription>
            </CardHeader>
            <CardContent>
              {investmentsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Investment</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>ROI</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(investments.length > 0 ? investments : mockInvestments).slice(0, 3).map((investment: any) => {
                      const currentValue = investment.current_value || investment.investment_amount * 1.1
                      const roi = investment.roi || investment.current_performance || 10.0
                      return (
                    <TableRow key={investment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{investment.project_name}</div>
                          <div className="text-sm text-gray-500">{investment.developer || 'Affordable Housing Partners'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          {investment.location}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(investment.investment_amount)}</TableCell>
                      <TableCell>{formatCurrency(currentValue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                          {formatPercentage(roi)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(investment.status)}>
                          {investment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedInvestment(investment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    )})}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Active Investments</CardTitle>
              <CardDescription>All currently active investment positions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Investment Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>ROI</TableHead>
                    <TableHead>AMI Compliance</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(investments.length > 0 ? investments : mockInvestments).filter((inv: any) => inv.status === 'active' || inv.status === 'performing').map((investment: any) => {
                    const currentValue = investment.current_value || investment.investment_amount * 1.1
                    const roi = investment.roi || investment.current_performance || 10.0
                    const amiCompliance = investment.ami_compliance || 92.5
                    const riskLevel = investment.risk_level || 'low'
                    const completionDate = investment.completion_date || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
                    const unitsFunded = investment.units_funded || Math.floor(investment.investment_amount / 50000)
                    
                    return (
                    <TableRow key={investment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{investment.project_name}</div>
                          <div className="text-sm text-gray-500">{investment.developer || 'Affordable Housing Partners'}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {investment.location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(investment.investment_date || investment.date_invested)}</TableCell>
                      <TableCell>{formatCurrency(investment.investment_amount)}</TableCell>
                      <TableCell>{formatCurrency(currentValue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                          {formatPercentage(roi)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {amiCompliance >= 90 ? (
                            <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
                          ) : amiCompliance >= 80 ? (
                            <div className="h-2 w-2 bg-yellow-500 rounded-full mr-2" />
                          ) : (
                            <div className="h-2 w-2 bg-red-500 rounded-full mr-2" />
                          )}
                          {formatPercentage(amiCompliance)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(riskLevel)}>
                          {riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(completionDate)}</div>
                          <div className="text-gray-500">{unitsFunded} units</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Modal>
                          <ModalTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </ModalTrigger>
                          <ModalContent>
                            <ModalHeader>
                              <ModalTitle>{investment.project_name}</ModalTitle>
                              <ModalDescription>
                                Investment details and performance metrics
                              </ModalDescription>
                            </ModalHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Developer</label>
                                  <p className="text-sm">{investment.developer || 'Affordable Housing Partners'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Location</label>
                                  <p className="text-sm">{investment.location}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Investment Amount</label>
                                  <p className="text-sm font-medium">{formatCurrency(investment.investment_amount)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Current Value</label>
                                  <p className="text-sm font-medium">{formatCurrency(currentValue)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">ROI</label>
                                  <p className="text-sm font-medium text-green-600">{formatPercentage(roi)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">AMI Compliance</label>
                                  <p className="text-sm font-medium">{formatPercentage(amiCompliance)}</p>
                                </div>
                              </div>
                            </div>
                          </ModalContent>
                        </Modal>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border-0 shadow-lg bg-white rounded-lg">
              <LineChart 
                title="Cumulative Returns"
                description="Total investment value over time ($M)"
                data={performanceData.map((item: any) => ({ 
                  name: item.name, 
                  value: item.invested / 1000000 
                }))}
                xAxisKey="name"
                dataKey="value"
                height={300}
                color="#6b8e3a"
              />
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Return</span>
                    <span className="font-medium text-green-600">+$750,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Annualized Return</span>
                    <span className="font-medium">10.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Best Performing Investment</span>
                    <span className="font-medium">Downtown Senior Housing (12.5%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Hold Period</span>
                    <span className="font-medium">18 months</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Compliance Rate</span>
                    <span className="font-medium text-green-600">92.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Risk Alerts</CardTitle>
                <CardDescription>Investments requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">AMI Compliance Below Target</p>
                      <p className="text-xs text-yellow-600">Green Valley Apartments - 88.7%</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-teal-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-teal-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-teal-800">Completion Delay Risk</p>
                      <p className="text-xs text-teal-600">Riverside Commons - Q2 2025</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="border-0 shadow-lg bg-white rounded-lg lg:col-span-2">
              <BarChart 
                title="Risk Distribution"
                description="Portfolio allocation by risk category"
                data={riskDistribution}
                xAxisKey="name"
                dataKey="value"
                height={300}
                color="#6b8e3a"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}