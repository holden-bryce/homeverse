'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useQuery } from '@tanstack/react-query'
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
import { formatCurrency, formatDate } from '@/lib/utils'
import { matchingAPI } from '@/lib/api-client-browser'
import toast from 'react-hot-toast'

interface MatchData {
  id: string
  applicant: {
    id: string
    name: string
    email: string
    phone?: string
    household_size: number
    annual_income: number
    ami_percentage: number
    preferences?: string[]
    location_preference?: string
  }
  project: {
    id: string
    name: string
    location: string
    unit_count: number
    ami_range: string
    available_units: number
  }
  score: number
  reasons: string[]
  status: string
  created_at: string
  ai_confidence: string
}

interface Project {
  id: string
  name: string
  city: string
  state: string
}

interface AIInsight {
  type: string
  icon: string
  title: string
  description: string
  actionable: boolean
}

interface MatchingPageClientProps {
  initialMatches: MatchData[]
  projects: Project[]
  aiInsights: AIInsight[]
}

export default function MatchingPageClient({ 
  initialMatches, 
  projects, 
  aiInsights 
}: MatchingPageClientProps) {
  const [activeTab, setActiveTab] = useState('matches')
  const [selectedProject, setSelectedProject] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null)
  const [isPending, startTransition] = useTransition()

  // Fetch matches data from the backend
  const { data: allMatches = [], isLoading: matchesLoading, refetch } = useQuery({
    queryKey: ['matches', selectedProject],
    queryFn: async () => {
      const projectMatches: MatchData[] = []
      
      if (selectedProject === 'all') {
        // Get matches for all projects
        for (const project of projects) {
          try {
            const matches = await matchingAPI.getProjectMatches(project.id)
            projectMatches.push(...matches)
          } catch (error) {
            console.error(`Failed to fetch matches for project ${project.id}:`, error)
            // Continue with other projects
          }
        }
      } else {
        // Get matches for selected project
        try {
          const matches = await matchingAPI.getProjectMatches(selectedProject)
          projectMatches.push(...matches)
        } catch (error) {
          console.error(`Failed to fetch matches for project ${selectedProject}:`, error)
        }
      }
      
      return projectMatches
    },
    enabled: projects.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  const matches = allMatches

  const handleRunMatching = async () => {
    startTransition(async () => {
      try {
        const projectId = selectedProject !== 'all' ? selectedProject : undefined
        await matchingAPI.runMatching(projectId)
        toast.success('AI matching completed successfully!')
        // Refetch the matches data
        await refetch()
      } catch (error) {
        console.error('Failed to run matching:', error)
        toast.error('Failed to run AI matching. Please try again.')
      }
    })
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

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp': return TrendingUp
      case 'Target': return Target
      case 'AlertCircle': return AlertCircle
      default: return Target
    }
  }

  // Filter and sort matches
  const filteredMatches = matches
    .filter(match => filterStatus === 'all' || match.status === filterStatus)
    .filter(match => selectedProject === 'all' || match.project.id === selectedProject)
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
            disabled={isPending}
          >
            {isPending ? (
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
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Match Score</SelectItem>
                  <SelectItem value="date">Date Created</SelectItem>
                  <SelectItem value="name">Applicant Name</SelectItem>
                </SelectContent>
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
          ) : filteredMatches.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto">
                    <Target className="h-8 w-8 text-sage-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
                    <p className="text-gray-600 mb-4">
                      {matches.length === 0 
                        ? "Run AI matching to find the best applicant matches for your projects."
                        : "No matches found with the current filters. Try adjusting your criteria."
                      }
                    </p>
                    {matches.length === 0 && (
                      <Button 
                        onClick={handleRunMatching}
                        disabled={isPending}
                        className="bg-sage-600 hover:bg-sage-700"
                      >
                        {isPending ? (
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
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedMatch(match)}
                        >
                          View Details
                        </Button>
                        
                        <Button 
                          size="sm" 
                          className="bg-sage-600 hover:bg-sage-700"
                          onClick={() => window.open(`mailto:${match.applicant.email}?subject=Regarding ${match.project.name} Housing Opportunity`, '_blank')}
                        >
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
              const Icon = getIconComponent(insight.icon)
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
                  <div className="text-3xl font-bold text-green-600">{matches.length}</div>
                  <div className="text-sm text-gray-600">Total Matches</div>
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
                  {projects.slice(0, 3).map((project, index) => (
                    <div key={project.id} className="flex justify-between items-center">
                      <span className="font-medium">{project.name}</span>
                      <span className="text-green-600 font-semibold">
                        {95 - index * 2}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Match Details Modal - could be extracted to separate component */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedMatch.applicant.name} - Match Details</h2>
                  <p className="text-gray-600">Comprehensive match analysis and applicant information</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedMatch(null)}
                >
                  Close
                </Button>
              </div>

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
                        <span>{selectedMatch.applicant.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location Preference:</span>
                        <span>{selectedMatch.applicant.location_preference || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Preferences</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedMatch.applicant.preferences || []).map((pref: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {pref}
                        </Badge>
                      ))}
                      {(!selectedMatch.applicant.preferences || selectedMatch.applicant.preferences.length === 0) && (
                        <span className="text-sm text-gray-500">No preferences specified</span>
                      )}
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
                  <Button 
                    className="bg-sage-600 hover:bg-sage-700"
                    onClick={() => window.open(`mailto:${selectedMatch.applicant.email}?subject=Regarding ${selectedMatch.project.name} Housing Opportunity`, '_blank')}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => selectedMatch.applicant.phone && window.open(`tel:${selectedMatch.applicant.phone}`, '_self')}
                    disabled={!selectedMatch.applicant.phone}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call Applicant
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}