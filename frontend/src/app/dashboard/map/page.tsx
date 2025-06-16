'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  Search,
  Filter,
  MapPin,
  Building2,
  Users,
  DollarSign,
  Eye,
  Layers,
  RotateCcw,
  Maximize2,
  Settings
} from 'lucide-react'
import { ProjectMap } from '@/components/maps/project-map'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/supabase-auth-provider'

// Fallback mock data for projects with enhanced geographic spread
const fallbackProjects = [
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
    price_range: '$1,200 - $2,800',
    transit_score: 95,
    school_rating: 8,
    is_saved: true,
    match_score: 94,
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
    price_range: '$1,500 - $3,200',
    transit_score: 88,
    school_rating: 9,
    is_saved: false,
    match_score: 88,
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
    price_range: '$1,400 - $3,500',
    transit_score: 76,
    school_rating: 7,
    is_saved: false,
    match_score: 82,
  },
  {
    id: '4',
    name: 'Mission Bay Heights',
    developer: 'SF Housing Partners',
    location: 'San Francisco, CA',
    coordinates: [37.7706, -122.3893] as [number, number],
    ami_ranges: ['50%', '80%', '100%'],
    unit_types: ['1BR', '2BR', '3BR'],
    units_available: 32,
    total_units: 150,
    estimated_delivery: '2024-09-30',
    status: 'marketing',
    price_range: '$1,800 - $3,500',
    transit_score: 92,
    school_rating: 8,
    is_saved: true,
    match_score: 89,
  },
  {
    id: '5',
    name: 'East Bay Commons',
    developer: 'East Bay Housing Corp',
    location: 'Berkeley, CA',
    coordinates: [37.8715, -122.2730] as [number, number],
    ami_ranges: ['30%', '50%', '80%'],
    unit_types: ['Studio', '1BR', '2BR'],
    units_available: 18,
    total_units: 95,
    estimated_delivery: '2025-01-15',
    status: 'construction',
    price_range: '$1,300 - $2,400',
    transit_score: 85,
    school_rating: 9,
    is_saved: false,
    match_score: 91,
  },
]

export default function MapViewPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [projects, setProjects] = useState<any[]>(fallbackProjects) // Start with fallback data
  const [loading, setLoading] = useState(false) // Don't block map rendering
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAMI, setSelectedAMI] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  const [mapStyle, setMapStyle] = useState('streets')
  const [mapReady, setMapReady] = useState(false)

  // Load projects from Supabase
  useEffect(() => {
    // Show map immediately with fallback data, then load real data
    setMapReady(true)
    loadProjects()
  }, [])

  const loadProjects = async () => {
    console.log('Loading projects for map view...')
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Projects query result:', { data, error })

      if (error) {
        console.error('Error loading projects:', error)
        // Use fallback data if database fails
        setProjects(fallbackProjects)
      } else {
        // Transform Supabase data to match expected format
        const transformedProjects = data?.map(project => {
          // Handle coordinates - PostgreSQL returns [lng, lat], but our component expects [lat, lng]
          let coords = [37.7749, -122.4194]; // Default SF
          if (project.coordinates && Array.isArray(project.coordinates) && project.coordinates.length === 2) {
            // Swap from [lng, lat] to [lat, lng] if needed
            const [first, second] = project.coordinates;
            coords = [second, first]; // PostgreSQL gives [lng, lat], we need [lat, lng]
          }
          
          console.log(`Project ${project.name} coordinates:`, project.coordinates, '→', coords);
          
          return {
            id: project.id,
            name: project.name,
            developer: project.developer_name || 'Developer',
            location: project.location || 'Location TBD',
            coordinates: coords as [number, number],
            ami_ranges: [`${project.ami_percentage || 80}%`],
            unit_types: project.unit_types || ['1BR', '2BR'],
            units_available: project.available_units || 0,
            total_units: project.total_units || 0,
            estimated_delivery: project.estimated_delivery,
            status: project.status || 'planning',
            price_range: project.price_range || 'Contact for pricing',
            transit_score: 85,
            school_rating: 8,
            is_saved: false,
            match_score: 85,
          };
        }) || []

        console.log('Transformed projects:', transformedProjects);
        setProjects(transformedProjects.length > 0 ? transformedProjects : fallbackProjects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects(fallbackProjects)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAMI = selectedAMI === 'all' || project.ami_ranges.includes(selectedAMI)
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus
    
    return matchesSearch && matchesAMI && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepting_applications':
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

  const selectedProjectData = selectedProject ? projects.find(p => p.id === selectedProject) : undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-cream-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Map View</h1>
              <p className="text-gray-600 mt-1">
                Explore affordable housing projects across the region
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-full"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedAMI('all')
                setSelectedStatus('all')
                setSelectedProject(undefined)
              }}
              className="rounded-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
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
                    placeholder="Search by project name or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-sage-200 focus:border-sage-400 rounded-full h-12"
                  />
                </div>
                <Select value={mapStyle} onValueChange={setMapStyle}>
                  <SelectTrigger className="w-40 rounded-full">
                    <Layers className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Map Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="streets">Streets</SelectItem>
                    <SelectItem value="satellite">Satellite</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-sage-100">
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
                      <SelectItem value="100%">100% AMI</SelectItem>
                      <SelectItem value="120%">120% AMI</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Project Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="accepting_applications">Accepting Applications</SelectItem>
                      <SelectItem value="construction">Under Construction</SelectItem>
                      <SelectItem value="planning">In Planning</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Advanced Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Map and Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <ProjectMap
                  projects={filteredProjects}
                  height={600}
                  selectedProject={selectedProject}
                  onProjectSelect={(projectId) => {
                    setSelectedProject(projectId === selectedProject ? undefined : projectId)
                  }}
                  onProjectHover={(projectId) => {
                    console.log('Hovered project:', projectId)
                  }}
                />
              </CardContent>
            </Card>

            {/* Map Controls */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Showing {filteredProjects.length} of {projects.length} projects
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="rounded-full">
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Fullscreen
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => router.push('/dashboard/buyers')}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  List View
                </Button>
              </div>
            </div>
          </div>

          {/* Project Details Sidebar */}
          <div className="space-y-6">
            {selectedProjectData ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{selectedProjectData.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProject(undefined)}
                      className="rounded-full p-2"
                    >
                      ×
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {selectedProjectData.location}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Badge className={`${getStatusColor(selectedProjectData.status)} rounded-full border`}>
                      {selectedProjectData.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Available Units</div>
                      <div className="font-semibold">{selectedProjectData.units_available}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Total Units</div>
                      <div className="font-semibold">{selectedProjectData.total_units}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Price Range</div>
                      <div className="font-semibold">{selectedProjectData.price_range}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Transit Score</div>
                      <div className="font-semibold">{selectedProjectData.transit_score}/100</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-2">AMI Ranges</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedProjectData.ami_ranges.map((ami: string) => (
                        <Badge key={ami} className="bg-sage-100 text-sage-800 border border-sage-200 rounded-full text-xs">
                          {ami} AMI
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-2">Unit Types</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedProjectData.unit_types.map((type: string) => (
                        <Badge key={type} className="bg-cream-100 text-cream-800 border border-cream-200 rounded-full text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      className="bg-sage-600 hover:bg-sage-700 text-white rounded-full flex-1"
                      onClick={() => router.push(`/dashboard/projects/${selectedProjectData.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto h-16 w-16 bg-sage-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-sage-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Project</h3>
                  <p className="text-gray-500 text-sm">
                    Click on any marker on the map to view project details and information.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Map Legend */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Map Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Accepting Applications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
                  <span className="text-sm">Under Construction</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                  <span className="text-sm">In Planning</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Marketing Phase</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Projects</span>
                  <span className="font-semibold">{filteredProjects.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available Units</span>
                  <span className="font-semibold">
                    {filteredProjects.reduce((sum, p) => sum + p.units_available, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Transit Score</span>
                  <span className="font-semibold">
                    {Math.round(filteredProjects.reduce((sum, p) => sum + p.transit_score, 0) / filteredProjects.length)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}