'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PropertySearchMap } from '@/components/buyer-portal/search/PropertySearchMap'
import { PropertyCard } from '@/components/buyer-portal/search/PropertyCard'
import { SearchFilters } from '@/components/buyer-portal/search/SearchFilters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { 
  Search,
  SlidersHorizontal,
  Heart,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Home,
  MapPin,
  Bookmark,
  Bell
} from 'lucide-react'

// Enhanced mock data with Zillow-style properties
const mockProperties = [
  {
    id: '1',
    name: 'Sunset Gardens',
    address: '1234 Sunset Blvd',
    location: 'San Francisco, CA',
    coordinates: [37.7749, -122.4194] as [number, number],
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
    ],
    monthlyRent: 1800,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 850,
    amiLevels: '30-80%',
    availableUnits: 24,
    totalUnits: 120,
    status: 'Available',
    completionDate: '2024-12-15',
    matchScore: 94,
    developer: 'Urban Housing LLC',
    amenities: ['Parking', 'Laundry', 'Gym', 'Pet Friendly'],
  },
  {
    id: '2',
    name: 'Riverside Commons',
    address: '5678 River Road',
    location: 'Oakland, CA',
    coordinates: [37.8044, -122.2711] as [number, number],
    images: [
      'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
    ],
    monthlyRent: 2200,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1200,
    amiLevels: '50-120%',
    availableUnits: 15,
    totalUnits: 85,
    status: 'Coming Soon',
    completionDate: '2025-03-20',
    matchScore: 88,
    developer: 'Bay Area Developers',
    amenities: ['Parking', 'Pool', 'Playground', 'Elevator'],
  },
  {
    id: '3',
    name: 'Harbor View Apartments',
    address: '9012 Harbor Way',
    location: 'San Jose, CA',
    coordinates: [37.3382, -121.8863] as [number, number],
    images: [
      'https://images.unsplash.com/photo-1565363887715-8884629e09ee?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop'
    ],
    monthlyRent: 2500,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    amiLevels: '60-100%',
    availableUnits: 45,
    totalUnits: 200,
    status: 'Available',
    completionDate: '2025-08-30',
    matchScore: 82,
    developer: 'Coastal Development Group',
    amenities: ['Parking', 'Gym', 'Pool', 'Concierge'],
  },
  {
    id: '4',
    name: 'Mission Bay Towers',
    address: '3456 Mission St',
    location: 'San Francisco, CA',
    coordinates: [37.7707, -122.3920] as [number, number],
    images: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=600&fit=crop'
    ],
    monthlyRent: 1650,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    amiLevels: '30-60%',
    availableUnits: 12,
    totalUnits: 60,
    status: 'Waitlist',
    completionDate: '2024-10-30',
    matchScore: 91,
    developer: 'Mission Housing Corp',
    amenities: ['Laundry', 'Bike Storage', 'Rooftop Deck'],
  },
  {
    id: '5',
    name: 'Downtown Plaza',
    address: '789 Market Street',
    location: 'San Francisco, CA',
    coordinates: [37.7849, -122.4094] as [number, number],
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1527359443443-84a48aec73d2?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1534237710431-e2fc698436d0?w=800&h=600&fit=crop'
    ],
    monthlyRent: 2800,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 950,
    amiLevels: '80-120%',
    availableUnits: 8,
    totalUnits: 100,
    status: 'Available',
    completionDate: '2024-06-15',
    matchScore: 76,
    developer: 'Urban Core Development',
    amenities: ['Parking', 'Gym', 'Concierge', 'Business Center'],
  },
]

const savedSearches = [
  {
    id: '1',
    name: '2BR under $2000',
    criteria: 'Bedrooms: 2, Max Rent: $2000',
    newMatches: 3,
    lastChecked: '2 hours ago',
  },
  {
    id: '2',
    name: 'Pet-friendly in SF',
    criteria: 'Location: San Francisco, Pet Friendly',
    newMatches: 5,
    lastChecked: '1 day ago',
  },
  {
    id: '3',
    name: '30% AMI eligible',
    criteria: 'AMI: 30%, Any location',
    newMatches: 2,
    lastChecked: '3 days ago',
  },
]

const applications = [
  {
    id: '1',
    propertyName: 'Sunset Gardens',
    status: 'under_review',
    submittedDate: '2024-01-10',
    lastUpdate: '2024-01-12',
    position: 15,
    totalApplicants: 150,
  },
  {
    id: '2',
    propertyName: 'Mission Bay Towers',
    status: 'approved',
    submittedDate: '2023-12-28',
    lastUpdate: '2024-01-05',
    offerExpires: '2024-01-20',
  },
  {
    id: '3',
    propertyName: 'Harbor View Apartments',
    status: 'waitlisted',
    submittedDate: '2023-12-15',
    lastUpdate: '2023-12-20',
    position: 45,
  },
]

export default function ZillowStyleBuyerPortal() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('discover')
  const [favorites, setFavorites] = useState<string[]>([])
  const [properties, setProperties] = useState(mockProperties)
  const [filteredProperties, setFilteredProperties] = useState(mockProperties)
  const [showFilters, setShowFilters] = useState(false)

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setFavorites(savedFavorites)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const filtered = properties.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProperties(filtered)
  }

  const handleFilterChange = (filters: any) => {
    // Apply filters to properties
    let filtered = [...properties]
    
    // Price filter
    if (filters.priceRange) {
      filtered = filtered.filter(p => 
        p.monthlyRent >= filters.priceRange[0] && 
        p.monthlyRent <= filters.priceRange[1]
      )
    }
    
    // Bedroom filter
    if (filters.bedrooms.length > 0) {
      filtered = filtered.filter(p => {
        const bedroomStr = p.bedrooms?.toString() || 'Studio'
        return filters.bedrooms.includes(bedroomStr) || 
               (filters.bedrooms.includes('4+') && p.bedrooms >= 4)
      })
    }
    
    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(p => filters.status.includes(p.status))
    }
    
    // Sort
    if (filters.sortBy === 'price_low') {
      filtered.sort((a, b) => (a.monthlyRent || 0) - (b.monthlyRent || 0))
    } else if (filters.sortBy === 'price_high') {
      filtered.sort((a, b) => (b.monthlyRent || 0) - (a.monthlyRent || 0))
    } else if (filters.sortBy === 'match_score') {
      filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    }
    
    setFilteredProperties(filtered)
  }

  const toggleFavorite = (propertyId: string) => {
    const newFavorites = favorites.includes(propertyId) 
      ? favorites.filter(id => id !== propertyId)
      : [...favorites, propertyId]
    
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(newFavorites))
    
    toast({
      title: favorites.includes(propertyId) ? "Removed from favorites" : "Added to favorites",
      description: "Your favorites list has been updated.",
    })
  }

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'under_review':
        return 'bg-teal-100 text-teal-800'
      case 'waitlisted':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Find Your Next Home</h1>
              <p className="text-gray-600 text-sm">Discover affordable housing opportunities</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full">
                <Bell className="h-4 w-4 mr-1" />
                Alerts
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full"
                onClick={() => router.push('/dashboard/buyers/preferences')}
              >
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                Preferences
              </Button>
              <Badge className="bg-teal-100 text-teal-800">
                <Heart className="h-3 w-3 mr-1" />
                {favorites.length} Saved
              </Badge>
            </div>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search by location, property name, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 h-12 px-8">
              Search
            </Button>
          </form>
        </div>
        
        {/* Tabs */}
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-12 bg-transparent">
              <TabsTrigger value="discover" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600">
                <MapPin className="h-4 w-4 mr-2" />
                Discover
              </TabsTrigger>
              <TabsTrigger value="saved" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600">
                <Heart className="h-4 w-4 mr-2" />
                Saved Homes
              </TabsTrigger>
              <TabsTrigger value="applications" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600">
                <Home className="h-4 w-4 mr-2" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="searches" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600">
                <Bookmark className="h-4 w-4 mr-2" />
                Saved Searches
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'discover' && (
          <div className="h-[calc(100vh-180px)]">
            <PropertySearchMap
              properties={filteredProperties}
              onFiltersChange={handleFilterChange}
              onPropertySelect={(property) => {
                router.push(`/dashboard/buyers/properties/${property.id}`)
              }}
            />
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.filter(p => favorites.includes(p.id)).map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isFavorited={true}
                  onFavorite={toggleFavorite}
                />
              ))}
            </div>
            {favorites.length === 0 && (
              <Card className="max-w-md mx-auto mt-12">
                <CardContent className="text-center py-12">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No saved homes yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start exploring and save homes you're interested in
                  </p>
                  <Button 
                    onClick={() => setActiveTab('discover')}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Start Searching
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="space-y-4">
              {applications.map(app => (
                <Card key={app.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{app.propertyName}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span>Submitted: {new Date(app.submittedDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Last Update: {new Date(app.lastUpdate).toLocaleDateString()}</span>
                        </div>
                        
                        {app.position && (
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              Position #{app.position} {app.totalApplicants && `of ${app.totalApplicants} applicants`}
                            </span>
                          </div>
                        )}
                        
                        {app.offerExpires && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Offer expires: {new Date(app.offerExpires).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                        <Badge className={getApplicationStatusColor(app.status)}>
                          {app.status.replace('_', ' ')}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/dashboard/buyers/applications/${app.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'searches' && (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="grid gap-4">
              {savedSearches.map(search => (
                <Card key={search.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{search.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{search.criteria}</p>
                        <p className="text-sm text-gray-500">Last checked: {search.lastChecked}</p>
                      </div>
                      <div className="text-right">
                        {search.newMatches > 0 && (
                          <Badge className="bg-teal-100 text-teal-800 mb-2">
                            {search.newMatches} new
                          </Badge>
                        )}
                        <div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Apply saved search filters
                              toast({
                                title: "Search Applied",
                                description: `Showing results for "${search.name}"`,
                              })
                              setActiveTab('discover')
                            }}
                          >
                            View Results
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button 
                variant="outline" 
                className="w-full h-24 border-dashed"
                onClick={() => setShowFilters(true)}
              >
                <Search className="h-6 w-6 mr-2" />
                Create New Saved Search
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <SearchFilters
          isModal
          onClose={() => setShowFilters(false)}
          onFilterChange={(filters) => {
            handleFilterChange(filters)
            setShowFilters(false)
          }}
        />
      )}
    </div>
  )
}