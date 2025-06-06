'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  Filter,
  MapPin,
  Building2,
  DollarSign,
  Users,
  Calendar,
  Heart,
  Star,
  Eye,
  Bookmark,
  SlidersHorizontal,
  Map,
  List,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { ProjectMap } from '@/components/maps/project-map'

// Mock data for projects
const projects = [
  {
    id: '1',
    name: 'Sunset Gardens',
    developer: 'Urban Housing LLC',
    location: 'San Francisco, CA',
    coordinates: [37.7749, -122.4194] as [number, number],
    ami_ranges: ['30%', '50%', '80%'],
    unit_types: ['Studio', '1BR', '2BR'],
    units_available: 24,
    total_units: 120,
    estimated_delivery: '2024-12-15',
    status: 'accepting_applications',
    amenities: ['parking', 'playground', 'laundry', 'fitness'],
    description: 'Modern affordable housing in the heart of San Francisco with excellent transit access.',
    price_range: '$1,200 - $2,800',
    transit_score: 95,
    school_rating: 8,
    is_saved: true,
    match_score: 94,
    images: ['/api/placeholder/400/300'],
  },
  {
    id: '2',
    name: 'Riverside Commons',
    developer: 'Bay Area Developers',
    location: 'Oakland, CA',
    coordinates: [37.8044, -122.2711] as [number, number],
    ami_ranges: ['50%', '80%', '120%'],
    unit_types: ['1BR', '2BR', '3BR'],
    units_available: 15,
    total_units: 85,
    estimated_delivery: '2025-03-20',
    status: 'construction',
    amenities: ['parking', 'transit', 'laundry', 'community_room'],
    description: 'Family-friendly community near top-rated schools and public transportation.',
    price_range: '$1,500 - $3,200',
    transit_score: 88,
    school_rating: 9,
    is_saved: false,
    match_score: 88,
    images: ['/api/placeholder/400/300'],
  },
  {
    id: '3',
    name: 'Harbor View Apartments',
    developer: 'Coastal Development Group',
    location: 'San Jose, CA',
    coordinates: [37.3382, -121.8863] as [number, number],
    ami_ranges: ['30%', '60%', '80%'],
    unit_types: ['Studio', '1BR', '2BR', '3BR'],
    units_available: 45,
    total_units: 200,
    estimated_delivery: '2025-08-30',
    status: 'planning',
    amenities: ['parking', 'playground', 'fitness', 'pool'],
    description: 'Waterfront living with stunning bay views and modern amenities.',
    price_range: '$1,400 - $3,500',
    transit_score: 76,
    school_rating: 7,
    is_saved: false,
    match_score: 82,
    images: ['/api/placeholder/400/300'],
  },
]

const savedSearches = [
  {
    id: '1',
    name: '2BR near transit',
    criteria: 'unit_type=2BR&max_commute=30&transit_score=80+',
    results_count: 12,
    last_updated: '2024-01-15',
  },
  {
    id: '2',
    name: 'Family-friendly 50% AMI',
    criteria: 'ami_band=50%&household_size=4&amenities=playground',
    results_count: 8,
    last_updated: '2024-01-12',
  },
]

const recentActivity = [
  {
    id: '1',
    type: 'application',
    title: 'Application submitted',
    description: 'Sunset Gardens - 2BR unit application',
    time: '2 hours ago',
    status: 'pending',
  },
  {
    id: '2',
    type: 'match',
    title: 'New match found',
    description: 'Harbor View Apartments - 94% compatibility',
    time: '1 day ago',
    status: 'new',
  },
  {
    id: '3',
    type: 'update',
    title: 'Project status updated',
    description: 'Riverside Commons construction progress',
    time: '3 days ago',
    status: 'info',
  },
]

export default function BuyersPage() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAMI, setSelectedAMI] = useState('all')
  const [selectedUnitType, setSelectedUnitType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAMI = selectedAMI === 'all' || project.ami_ranges.includes(selectedAMI)
    const matchesUnitType = selectedUnitType === 'all' || project.unit_types.includes(selectedUnitType)
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus
    
    return matchesSearch && matchesAMI && matchesUnitType && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepting_applications':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'construction':
        return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'planning':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'waitlist_only':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepting_applications':
        return <CheckCircle className="h-4 w-4" />
      case 'construction':
      case 'planning':
        return <Clock className="h-4 w-4" />
      case 'waitlist_only':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Discovery</h1>
            <p className="text-gray-600 mt-1">
              Find affordable housing opportunities that match your needs
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full">
              <Bookmark className="mr-2 h-4 w-4" />
              Saved Projects
            </Button>
            <Button className="bg-sage-600 hover:bg-sage-700 text-white rounded-full px-6" onClick={() => alert('Preferences page coming soon!')}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Update Preferences
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              {/* Primary Search */}
              <div className="flex space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search by project name, location, or developer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-sage-200 focus:border-sage-400 rounded-full h-12"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="rounded-full px-6 h-12"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
                <div className="flex border border-sage-200 rounded-full p-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-full"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="rounded-full"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-sage-100">
                  <Select value={selectedAMI} onValueChange={setSelectedAMI}>
                    <SelectTrigger>
                      <SelectValue placeholder="AMI Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All AMI Ranges</SelectItem>
                      <SelectItem value="30%">30% AMI</SelectItem>
                      <SelectItem value="50%">50% AMI</SelectItem>
                      <SelectItem value="60%">60% AMI</SelectItem>
                      <SelectItem value="80%">80% AMI</SelectItem>
                      <SelectItem value="120%">120% AMI</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedUnitType} onValueChange={setSelectedUnitType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unit Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Unit Types</SelectItem>
                      <SelectItem value="Studio">Studio</SelectItem>
                      <SelectItem value="1BR">1 Bedroom</SelectItem>
                      <SelectItem value="2BR">2 Bedroom</SelectItem>
                      <SelectItem value="3BR">3 Bedroom</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="accepting_applications">Accepting Applications</SelectItem>
                      <SelectItem value="construction">Under Construction</SelectItem>
                      <SelectItem value="planning">In Planning</SelectItem>
                      <SelectItem value="waitlist_only">Waitlist Only</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="w-full">
                    More Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {viewMode === 'list' ? (
              <div className="space-y-6">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                            <Badge className={`${getStatusColor(project.status)} rounded-full border`}>
                              {getStatusIcon(project.status)}
                              <span className="ml-1">{project.status.replace('_', ' ')}</span>
                            </Badge>
                            {project.match_score && (
                              <Badge className="bg-sage-100 text-sage-800 border border-sage-200 rounded-full">
                                <Star className="h-3 w-3 mr-1" />
                                {project.match_score}% match
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {project.location}
                            <span className="mx-2">•</span>
                            <Building2 className="h-4 w-4 mr-1" />
                            {project.developer}
                          </div>
                          <p className="text-gray-600 mb-4">{project.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full p-2"
                        >
                          <Heart className={`h-4 w-4 ${project.is_saved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-500">Price Range</div>
                          <div className="font-semibold">{project.price_range}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Available Units</div>
                          <div className="font-semibold">{project.units_available} of {project.total_units}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Delivery</div>
                          <div className="font-semibold">{new Date(project.estimated_delivery).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Transit Score</div>
                          <div className="font-semibold">{project.transit_score}/100</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="text-sm text-gray-500 mr-2">AMI Ranges:</div>
                        {project.ami_ranges.map((ami) => (
                          <Badge key={ami} className="bg-cream-100 text-cream-800 border border-cream-200 rounded-full text-xs">
                            {ami} AMI
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button className="bg-sage-600 hover:bg-sage-700 text-white rounded-full" onClick={() => alert(`Project details for ${project.name} coming soon!`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                          {project.status === 'accepting_applications' && (
                            <Button variant="outline" className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full" onClick={() => alert(`Application for ${project.name} coming soon!`)}>
                              Apply Now
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {project.unit_types.join(', ')}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Est. {new Date(project.estimated_delivery).getFullYear()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredProjects.length === 0 && (
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-12 text-center">
                      <div className="mx-auto h-24 w-24 bg-sage-100 rounded-full flex items-center justify-center mb-4">
                        <Building2 className="h-12 w-12 text-sage-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                      <p className="text-gray-500 mb-4">
                        Try adjusting your search criteria or filters to find more projects.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('')
                          setSelectedAMI('all')
                          setSelectedUnitType('all')
                          setSelectedStatus('all')
                        }}
                        className="rounded-full"
                      >
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              // Map View
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <ProjectMap
                      projects={filteredProjects}
                      height={600}
                      onProjectSelect={(projectId) => {
                        // Handle project selection
                        console.log('Selected project:', projectId)
                      }}
                      onProjectHover={(projectId) => {
                        // Handle project hover
                        console.log('Hovered project:', projectId)
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Map Results Summary */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {filteredProjects.length} projects found
                        </h3>
                        <p className="text-gray-600">
                          Click on map markers to view project details
                        </p>
                      </div>
                      <Button
                        onClick={() => setViewMode('list')}
                        variant="outline"
                        className="border-sage-200 text-sage-700 hover:bg-sage-50 rounded-full"
                      >
                        <List className="mr-2 h-4 w-4" />
                        Switch to List View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Saved Searches */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Saved Searches</CardTitle>
                <CardDescription>
                  Quick access to your favorite criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {savedSearches.map((search) => (
                  <div key={search.id} className="p-3 border border-sage-100 rounded-lg hover:bg-sage-50 cursor-pointer">
                    <div className="font-medium text-gray-900">{search.name}</div>
                    <div className="text-sm text-gray-500">{search.results_count} results</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Updated {new Date(search.last_updated).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full rounded-full">
                  Create New Search
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                  Your application updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.status === 'pending' ? 'bg-amber-100' :
                      activity.status === 'new' ? 'bg-green-100' : 'bg-teal-100'
                    }`}>
                      {activity.type === 'application' && <Building2 className="h-4 w-4 text-amber-600" />}
                      {activity.type === 'match' && <Star className="h-4 w-4 text-green-600" />}
                      {activity.type === 'update' && <Clock className="h-4 w-4 text-teal-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Application Status */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Application Status</CardTitle>
                <CardDescription>
                  Track your applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Applications</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Under Review</span>
                    <span className="font-semibold">1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Waitlisted</span>
                    <span className="font-semibold">2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Approved</span>
                    <span className="font-semibold text-green-600">1</span>
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