'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

// Mock recent searches
const recentSearches = [
  { id: '1', query: '2 bedroom under $2000', date: '2024-03-20' },
  { id: '2', query: 'Pet friendly in Oakland', date: '2024-03-19' },
  { id: '3', query: 'Near BART station', date: '2024-03-18' },
]

// Mock applications
const mockApplications = [
  {
    id: '1',
    propertyName: 'Sunset Gardens',
    status: 'under_review',
    submittedDate: '2024-01-15',
    lastUpdate: '2024-01-20',
  },
  {
    id: '2',
    propertyName: 'Riverside Commons',
    status: 'approved',
    submittedDate: '2024-01-10',
    lastUpdate: '2024-01-12',
    moveInDate: '2024-02-01',
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

interface BuyerPortalClientProps {
  initialProperties: any[]
}

export function BuyerPortalClient({ initialProperties }: BuyerPortalClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('discover')
  const [favorites, setFavorites] = useState<string[]>([])
  const [properties] = useState(initialProperties)
  const [filteredProperties, setFilteredProperties] = useState(initialProperties)
  const [showFilters, setShowFilters] = useState(false)
  
  // Check for success parameter and show toast
  useEffect(() => {
    const tab = searchParams.get('tab')
    const success = searchParams.get('success')
    
    if (tab) {
      setActiveTab(tab)
    }
    
    if (success === 'true') {
      toast({
        title: "Application Submitted!",
        description: "Your application has been successfully submitted. You'll receive updates via email.",
        variant: "default"
      })
      // Clean up URL
      router.replace('/dashboard/buyers?tab=applications')
    }
  }, [searchParams, router])

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
                console.log('Property selected:', property)
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
                    Browse Properties
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="p-6">
            <iframe 
              src="/dashboard/buyers/applications" 
              className="w-full h-[calc(100vh-240px)] border-0 rounded-lg"
              title="My Applications"
            />
          </div>
        )}

        {activeTab === 'searches' && (
          <div className="p-6">
            <div className="space-y-4">
              {recentSearches.map(search => (
                <Card key={search.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{search.query}</p>
                        <p className="text-sm text-gray-600">Saved on {new Date(search.date).toLocaleDateString()}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSearchTerm(search.query)
                          setActiveTab('discover')
                          handleSearch(new Event('submit') as any)
                        }}
                      >
                        Search Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}