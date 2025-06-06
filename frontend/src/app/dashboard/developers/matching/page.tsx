'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalTrigger } from '@/components/ui/modal'
import { 
  Target, 
  Users, 
  TrendingUp,
  MapPin,
  DollarSign,
  Heart,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Home,
  Zap,
  RefreshCw,
  Filter,
  Star,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { useMatches, useRunMatching, useProjects, useApplicants } from '@/lib/api/hooks'
import { formatCurrency, formatDate } from '@/lib/utils'

// Mock data for AI matching
const mockMatches = [
  {
    id: '1',
    applicant: {
      id: 'app_1',
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@email.com',
      phone: '(555) 123-4567',
      household_size: 3,
      annual_income: 75000,
      ami_percentage: 65,
      preferences: ['Family-friendly', 'Near transit', 'Community amenities'],
      location_preference: 'San Francisco, CA'
    },
    project: {
      id: 'proj_1',
      name: 'Sunset Gardens',
      location: 'San Francisco, CA',
      unit_count: 120,
      ami_range: '30-80%',
      available_units: 15
    },
    score: 94,
    reasons: [
      'Perfect AMI match (65% fits 30-80% range)',
      'Household size matches available 2-3 bedroom units',
      'Location preference aligns with project area',
      'High income stability score'
    ],
    status: 'new',
    created_at: '2024-06-04T10:30:00Z',
    ai_confidence: 'high'
  },
  {
    id: '2',
    applicant: {
      id: 'app_2',
      name: 'James Chen',
      email: 'james.chen@email.com',
      phone: '(555) 234-5678',
      household_size: 2,
      annual_income: 85000,
      ami_percentage: 75,
      preferences: ['Modern amenities', 'Parking', 'Pet-friendly'],
      location_preference: 'Oakland, CA'
    },
    project: {
      id: 'proj_2',
      name: 'Riverside Commons',
      location: 'Oakland, CA',
      unit_count: 85,
      ami_range: '50-120%',
      available_units: 8
    },
    score: 88,
    reasons: [
      'AMI within target range (75% fits 50-120%)',
      'Location preference match',
      'Strong financial profile',
      'Pet-friendly project amenities available'
    ],
    status: 'contacted',
    created_at: '2024-06-04T09:15:00Z',
    ai_confidence: 'high'
  },
  {
    id: '3',
    applicant: {
      id: 'app_3',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '(555) 345-6789',
      household_size: 4,
      annual_income: 65000,
      ami_percentage: 55,
      preferences: ['Family-friendly', 'Schools nearby', 'Playground'],
      location_preference: 'San Jose, CA'
    },
    project: {
      id: 'proj_3',
      name: 'Harbor View Apartments',
      location: 'San Jose, CA',
      unit_count: 200,
      ami_range: '30-60%',
      available_units: 25
    },
    score: 92,
    reasons: [
      'Excellent AMI fit (55% within 30-60% range)',
      'Large household matches 3-4 bedroom availability',
      'Family amenities align with preferences',
      'School district proximity score: 95%'
    ],
    status: 'interested',
    created_at: '2024-06-04T08:45:00Z',
    ai_confidence: 'very_high'
  },
  {
    id: '4',
    applicant: {
      id: 'app_4',
      name: 'David Kim',
      email: 'david.kim@email.com',
      phone: '(555) 456-7890',
      household_size: 1,
      annual_income: 52000,
      ami_percentage: 45,
      preferences: ['Studio/1BR', 'Transit access', 'Urban lifestyle'],
      location_preference: 'San Francisco, CA'
    },
    project: {
      id: 'proj_1',
      name: 'Sunset Gardens',
      location: 'San Francisco, CA',
      unit_count: 120,
      ami_range: '30-80%',
      available_units: 15
    },
    score: 76,
    reasons: [
      'AMI percentage fits project range',
      'Single occupancy matches studio units',
      'Transit accessibility: excellent',
      'Urban location preference satisfied'
    ],
    status: 'pending',
    created_at: '2024-06-04T07:20:00Z',
    ai_confidence: 'medium'
  }
]

const aiInsights = [
  {
    type: 'trend',
    icon: TrendingUp,
    title: 'Matching Success Rate Improving',
    description: 'AI matching accuracy increased 15% this month with 94% applicant satisfaction',
    actionable: true
  },
  {
    type: 'opportunity',
    icon: Target,
    title: 'High-Demand Demographics Identified',
    description: '60-80% AMI families show strongest interest in your projects',
    actionable: true
  },
  {
    type: 'alert',
    icon: AlertCircle,
    title: 'Seasonal Pattern Detected',
    description: 'Application volume typically increases 25% in spring months',
    actionable: false
  }
]

export default function DeveloperMatchingPage() {
  const [activeTab, setActiveTab] = useState('matches')
  const [selectedProject, setSelectedProject] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isRunningMatching, setIsRunningMatching] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<any>(null)

  // API hooks - using mock data for now
  // const { data: matches = mockMatches, isLoading: matchesLoading } = useMatches(selectedProject !== 'all' ? selectedProject : undefined)
  const matches = mockMatches
  const matchesLoading = false
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const runMatching = useRunMatching()

  const handleRunMatching = async () => {
    setIsRunningMatching(true)
    try {
      // TODO: Implement project-based matching API
      // For now, just simulate the action
      console.log('Running matching for project:', selectedProject)
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error('Failed to run matching:', error)
    } finally {
      setIsRunningMatching(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'interested': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'declined': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'very_high': return 'text-green-600'
      case 'high': return 'text-teal-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50'
    if (score >= 80) return 'text-teal-600 bg-teal-50'
    if (score >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  // Filter and sort matches
  const filteredMatches = matches
    .filter(match => filterStatus === 'all' || match.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'score': return b.score - a.score
        case 'date': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'name': return a.applicant.name.localeCompare(b.applicant.name)
        default: return 0
      }
    })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI-Powered Matching</h1>
          <p className="text-gray-600 mt-1">
            Find the best applicant matches for your affordable housing projects
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            className="border-sage-200 text-sage-700 hover:bg-sage-50"
            onClick={handleRunMatching}
            disabled={isRunningMatching}
          >
            {isRunningMatching ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Run AI Matching
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="pending">Pending</option>
                <option value="declined">Declined</option>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <option value="score">Match Score</option>
                <option value="date">Date Created</option>
                <option value="name">Applicant Name</option>
              </Select>
            </div>

            <div className="flex items-end">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Target className="h-3 w-3" />
                <span>{filteredMatches.length} matches</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-sage-100 rounded-full p-1">
          <TabsTrigger value="matches" className="rounded-full">Active Matches</TabsTrigger>
          <TabsTrigger value="insights" className="rounded-full">AI Insights</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-full">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-6">
          {matchesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <Card key={match.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-sage-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{match.applicant.name}</h3>
                          <p className="text-gray-600">{match.project.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">{match.project.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getScoreColor(match.score)}`}>
                            {match.score}%
                          </div>
                          <div className={`text-xs font-medium mt-1 ${getConfidenceColor(match.ai_confidence)}`}>
                            {match.ai_confidence.replace('_', ' ')} confidence
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(match.status)} rounded-full border`}>
                          {match.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">Household Details</div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm">Size:</span>
                            <span className="text-sm font-medium">{match.applicant.household_size} people</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Income:</span>
                            <span className="text-sm font-medium">{formatCurrency(match.applicant.annual_income)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">AMI:</span>
                            <span className="text-sm font-medium">{match.applicant.ami_percentage}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">Project Details</div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm">AMI Range:</span>
                            <span className="text-sm font-medium">{match.project.ami_range}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Available:</span>
                            <span className="text-sm font-medium">{match.project.available_units} units</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Total:</span>
                            <span className="text-sm font-medium">{match.project.unit_count} units</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">Match Reasons</div>
                        <div className="space-y-1">
                          {match.reasons.slice(0, 2).map((reason, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-600">{reason}</span>
                            </div>
                          ))}
                          {match.reasons.length > 2 && (
                            <div className="text-xs text-sage-600">
                              +{match.reasons.length - 2} more reasons
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Matched {formatDate(match.created_at)}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Modal>
                          <ModalTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedMatch(match)}>
                              View Details
                            </Button>
                          </ModalTrigger>
                          <ModalContent className="max-w-2xl">
                            <ModalHeader>
                              <ModalTitle>{match.applicant.name} - Match Details</ModalTitle>
                              <ModalDescription>
                                Comprehensive match analysis and applicant information
                              </ModalDescription>
                            </ModalHeader>
                            {selectedMatch && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="font-semibold mb-3">Applicant Profile</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span>Email:</span>
                                        <span>{selectedMatch.applicant.email}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Phone:</span>
                                        <span>{selectedMatch.applicant.phone}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Location Preference:</span>
                                        <span>{selectedMatch.applicant.location_preference}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold mb-3">Preferences</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedMatch.applicant.preferences.map((pref: string, index: number) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {pref}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-3">All Match Reasons</h4>
                                  <div className="space-y-2">
                                    {selectedMatch.reasons.map((reason: string, index: number) => (
                                      <div key={index} className="flex items-start space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                        <span className="text-sm">{reason}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                  <Button className="bg-sage-600 hover:bg-sage-700">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Email
                                  </Button>
                                  <Button variant="outline">
                                    <Phone className="mr-2 h-4 w-4" />
                                    Call Applicant
                                  </Button>
                                </div>
                              </div>
                            )}
                          </ModalContent>
                        </Modal>
                        
                        <Button size="sm" className="bg-sage-600 hover:bg-sage-700">
                          Contact
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {aiInsights.map((insight, index) => {
              const Icon = insight.icon
              return (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 text-sage-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                        {insight.actionable && (
                          <Button size="sm" variant="outline" className="text-xs">
                            Learn More
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Matching Algorithm Performance</CardTitle>
              <CardDescription>
                AI system performance metrics and optimization insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-sage-600">94%</div>
                  <div className="text-sm text-gray-600">Accuracy Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-teal-600">87%</div>
                  <div className="text-sm text-gray-600">Applicant Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">156</div>
                  <div className="text-sm text-gray-600">Successful Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">18 days</div>
                  <div className="text-sm text-gray-600">Avg. Match Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Match Success Rate</CardTitle>
                <CardDescription>Monthly tracking of successful matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-semibold">94% success rate</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Month</span>
                    <span className="font-semibold">89% success rate</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">3 Months Ago</span>
                    <span className="font-semibold">82% success rate</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Top Performing Projects</CardTitle>
                <CardDescription>Projects with highest match success</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Sunset Gardens</span>
                    <span className="text-green-600 font-semibold">97%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Harbor View Apartments</span>
                    <span className="text-green-600 font-semibold">93%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Riverside Commons</span>
                    <span className="text-teal-600 font-semibold">88%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}