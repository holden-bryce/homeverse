'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select } from '@/components/ui/select'
import Heatmap from '@/components/maps/heatmap'
import { BarChart } from '@/components/charts/bar-chart'
import { LineChart } from '@/components/charts/line-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { 
  TrendingUp, 
  MapPin, 
  Building2, 
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  Download,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatPercentage } from '@/lib/utils'

// Mock data for analytics
const marketInsights = [
  {
    title: 'Investment Opportunities',
    value: '47',
    change: '+12',
    trend: 'up' as const,
    icon: Target,
    description: 'New opportunities identified this month'
  },
  {
    title: 'Market Coverage',
    value: '89%',
    change: '+5%',
    trend: 'up' as const,
    icon: MapPin,
    description: 'Bay Area market penetration'
  },
  {
    title: 'AMI Compliance Rate',
    value: '94.2%',
    change: '+2.1%',
    trend: 'up' as const,
    icon: CheckCircle,
    description: 'Portfolio-wide compliance'
  },
  {
    title: 'Risk Score',
    value: '2.1',
    change: '-0.3',
    trend: 'up' as const,
    icon: AlertTriangle,
    description: 'Lower is better (1-5 scale)'
  }
]

const geographicDistribution = [
  { name: 'San Francisco', value: 35, investments: 15, amount: 45000000 },
  { name: 'Oakland', value: 28, investments: 12, amount: 32000000 },
  { name: 'San Jose', value: 22, investments: 8, amount: 28000000 },
  { name: 'Berkeley', value: 15, investments: 6, amount: 18000000 }
]

const opportunityZones = [
  { zone: 'OZ-001', location: 'Mission District, SF', score: 8.5, projects: 3, potential: 15000000 },
  { zone: 'OZ-002', location: 'West Oakland', score: 9.2, projects: 5, potential: 22000000 },
  { zone: 'OZ-003', location: 'East San Jose', score: 7.8, projects: 2, potential: 12000000 },
  { zone: 'OZ-004', location: 'Richmond District', score: 8.9, projects: 4, potential: 18000000 }
]

const marketTrends = [
  { month: 'Jan 2024', investment_volume: 12500000, compliance_rate: 91.2, opportunity_score: 7.2 },
  { month: 'Feb 2024', investment_volume: 15200000, compliance_rate: 92.1, opportunity_score: 7.5 },
  { month: 'Mar 2024', investment_volume: 18800000, compliance_rate: 93.4, opportunity_score: 8.1 },
  { month: 'Apr 2024', investment_volume: 22100000, compliance_rate: 94.2, opportunity_score: 8.3 },
  { month: 'May 2024', investment_volume: 19600000, compliance_rate: 93.8, opportunity_score: 8.0 },
  { month: 'Jun 2024', investment_volume: 25300000, compliance_rate: 94.7, opportunity_score: 8.6 }
]

export default function LendersAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [timeframe, setTimeframe] = useState('6M')
  const [dataType, setDataType] = useState('investment_density')

  // TODO: Replace with actual data hooks
  const portfolioStats = null
  const statsLoading = false
  const performanceData = null
  const performanceLoading = false

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Market Intelligence</h1>
          <p className="text-gray-600 mt-1">
            Geospatial analytics and market insights for investment decisions
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button className="bg-sage-600 hover:bg-sage-700 text-white">
            <Download className="mr-2 h-4 w-4" />
            Export Analysis
          </Button>
        </div>
      </div>

      {/* Market Insights Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {marketInsights.map((insight) => {
          const Icon = insight.icon
          return (
            <Card key={insight.title} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{insight.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{insight.value}</p>
                    <p className={`text-sm mt-1 ${
                      insight.trend === 'up' ? 'text-sage-600' : 'text-red-600'
                    }`}>
                      {insight.change} this month
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-sage-100 rounded-full flex items-center justify-center">
                    <Icon className="h-6 w-6 text-sage-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">{insight.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-sage-100 rounded-full p-1">
          <TabsTrigger value="overview" className="rounded-full">Market Overview</TabsTrigger>
          <TabsTrigger value="heatmap" className="rounded-full">Geographic Analysis</TabsTrigger>
          <TabsTrigger value="opportunities" className="rounded-full">Opportunity Zones</TabsTrigger>
          <TabsTrigger value="trends" className="rounded-full">Market Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Distribution */}
            <div className="border-0 shadow-lg bg-white rounded-lg">
              <PieChart 
                title="Investment Distribution by City"
                description="Portfolio allocation across Bay Area cities"
                data={geographicDistribution}
                height={300}
              />
              <div className="p-6 pt-0">
                <div className="space-y-2">
                  {geographicDistribution.map((city) => (
                    <div key={city.name} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{city.name}</span>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(city.amount)}</div>
                        <div className="text-gray-500">{city.investments} investments</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Market Performance Trends */}
            <div className="border-0 shadow-lg bg-white rounded-lg">
              <LineChart 
                title="Investment Volume Trend"
                description="Investment volume over time ($M)"
                data={marketTrends.map(item => ({ name: item.month, value: item.investment_volume / 1000000 }))}
                xAxisKey="name"
                dataKey="value"
                height={300}
                color="#6b8e3a"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Interactive Heatmap */}
            <Heatmap 
              height={500}
              showControls={true}
              className="col-span-full"
            />

            {/* Heatmap Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Hot Zones</CardTitle>
                  <CardDescription>High investment activity areas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Mission District</span>
                      <Badge className="bg-red-100 text-red-800">Very High</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">SOMA</span>
                      <Badge className="bg-orange-100 text-orange-800">High</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Oakland Downtown</span>
                      <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Emerging Areas</CardTitle>
                  <CardDescription>Growing investment opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Bayview-Hunters Point</span>
                      <div className="flex items-center space-x-1">
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                        <span className="text-sm text-green-600">+24%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">East Oakland</span>
                      <div className="flex items-center space-x-1">
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                        <span className="text-sm text-green-600">+18%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Daly City</span>
                      <div className="flex items-center space-x-1">
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                        <span className="text-sm text-green-600">+15%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                  <CardDescription>Market risk by geography</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Low Risk Zones</span>
                      <span className="text-sm font-medium text-green-600">45%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Medium Risk Zones</span>
                      <span className="text-sm font-medium text-yellow-600">35%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">High Risk Zones</span>
                      <span className="text-sm font-medium text-red-600">20%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Opportunity Zone Analysis</CardTitle>
              <CardDescription>
                Federal Opportunity Zones with highest investment potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunityZones.map((zone) => (
                  <div key={zone.zone} className="border border-sage-100 rounded-xl p-4 hover:bg-sage-50/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-teal-100 text-teal-800 border border-teal-200 rounded-full">
                          {zone.zone}
                        </Badge>
                        <h3 className="font-semibold">{zone.location}</h3>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-sage-600">
                          {zone.score}/10
                        </div>
                        <div className="text-sm text-gray-500">Opportunity Score</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Active Projects</div>
                        <div className="font-medium">{zone.projects}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Investment Potential</div>
                        <div className="font-medium">{formatCurrency(zone.potential)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Tax Benefits</div>
                        <div className="font-medium text-green-600">Available</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Investment Volume Trends */}
            <div className="border-0 shadow-lg bg-white rounded-lg">
              <BarChart 
                title="Investment Volume Trends"
                description="Monthly investment activity ($M)"
                data={marketTrends.map(item => ({ name: item.month, value: item.investment_volume / 1000000 }))}
                xAxisKey="name"
                dataKey="value"
                height={300}
                color="#6b8e3a"
              />
            </div>

            {/* Market Opportunity Score */}
            <div className="border-0 shadow-lg bg-white rounded-lg">
              <LineChart 
                title="Market Opportunity Score"
                description="Composite opportunity index over time"
                data={marketTrends.map(item => ({ name: item.month, value: item.opportunity_score }))}
                xAxisKey="name"
                dataKey="value"
                height={300}
                color="#0d9488"
              />
            </div>
          </div>

          {/* Market Insights */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Key Market Insights</CardTitle>
              <CardDescription>AI-powered analysis of market conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Strong Market Momentum</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Investment volume has increased 25% over the past quarter, indicating strong market confidence.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                    <Target className="h-5 w-5 text-teal-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-teal-800">Emerging Opportunities</h4>
                      <p className="text-sm text-teal-700 mt-1">
                        East Bay markets showing increased potential with 18% growth in opportunity scores.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Market Saturation Risk</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        San Francisco core areas approaching saturation. Consider expanding to emerging markets.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-sage-50 border border-sage-200 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-sage-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sage-800">Compliance Improvements</h4>
                      <p className="text-sm text-sage-700 mt-1">
                        Portfolio-wide AMI compliance has improved to 94.2%, exceeding regulatory requirements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}