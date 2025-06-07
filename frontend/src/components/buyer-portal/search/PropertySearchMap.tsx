'use client'

import { useState, useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PropertyCard } from './PropertyCard'
import { SearchFilters } from './SearchFilters'
import { Map, List, Filter, X, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Initialize Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface Property {
  id: string
  name: string
  address: string
  location: string
  coordinates: [number, number]
  monthlyRent?: number
  amiLevels: string
  totalUnits: number
  availableUnits?: number
  status: string
  matchScore?: number
}

interface PropertySearchMapProps {
  properties: Property[]
  onPropertySelect?: (property: Property) => void
  onFiltersChange?: (filters: any) => void
}

export function PropertySearchMap({ properties, onPropertySelect, onFiltersChange }: PropertySearchMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'split'>('split')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const markers = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!mapContainer.current) return

    console.log('Mapbox token:', mapboxgl.accessToken ? 'Set' : 'Not set')
    
    if (!mapboxgl.accessToken) {
      console.warn('Mapbox token not available, using fallback')
      // Create fallback map
      if (mapContainer.current) {
        mapContainer.current.innerHTML = `
          <div class="w-full h-full bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center rounded-lg border">
            <div class="text-center text-gray-600">
              <div class="text-4xl mb-4">🗺️</div>
              <div class="text-lg font-semibold mb-2">Interactive Map</div>
              <div class="text-sm">Mapbox configuration needed</div>
            </div>
          </div>
        `
      }
      return
    }

    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-122.4194, 37.7749], // San Francisco
        zoom: 12
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
      
      console.log('Mapbox map initialized successfully')
    } catch (error) {
      console.error('Error initializing Mapbox:', error)
      // Fallback
      if (mapContainer.current) {
        mapContainer.current.innerHTML = `
          <div class="w-full h-full bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center rounded-lg border">
            <div class="text-center text-gray-600">
              <div class="text-4xl mb-4">⚠️</div>
              <div class="text-lg font-semibold mb-2">Map Error</div>
              <div class="text-sm">Check Mapbox configuration</div>
            </div>
          </div>
        `
      }
    }

    // Cleanup
    return () => {
      map.current?.remove()
    }
  }, [])

  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Add markers for each property
    properties.forEach(property => {
      const el = document.createElement('div')
      el.className = 'property-marker'
      el.style.width = '40px'
      el.style.height = '40px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = property.matchScore && property.matchScore >= 80 ? '#0d9488' : '#6b7280'
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.color = 'white'
      el.style.fontWeight = 'bold'
      el.style.fontSize = '12px'
      el.innerHTML = property.availableUnits?.toString() || property.totalUnits.toString()

      const marker = new mapboxgl.Marker(el)
        .setLngLat(property.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-3">
              <h3 class="font-semibold text-lg">${property.name}</h3>
              <p class="text-sm text-gray-600">${property.location}</p>
              ${property.monthlyRent ? `<p class="text-teal-600 font-bold mt-1">$${property.monthlyRent}/mo</p>` : ''}
              <p class="text-sm text-gray-500 mt-1">AMI: ${property.amiLevels}</p>
              <p class="text-sm text-gray-500">${property.availableUnits || property.totalUnits} units available</p>
            </div>
          `)
        )
        .addTo(map.current!)

      el.addEventListener('click', () => {
        setSelectedProperty(property)
        onPropertySelect?.(property)
      })

      markers.current.push(marker)
    })

    // Fit map to show all markers
    if (properties.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      properties.forEach(property => {
        bounds.extend(property.coordinates)
      })
      map.current.fitBounds(bounds, { padding: 50 })
    }
  }, [properties, onPropertySelect])

  const toggleFavorite = (propertyId: string) => {
    setFavorites(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  const renderPropertyList = () => (
    <div className="space-y-4">
      {properties.map(property => (
        <PropertyCard
          key={property.id}
          property={property}
          variant="list"
          isFavorited={favorites.includes(property.id)}
          onFavorite={toggleFavorite}
        />
      ))}
    </div>
  )

  return (
    <div className={cn("relative h-full", isFullscreen && "fixed inset-0 z-50 bg-white")}>
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between gap-4">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
            className={viewMode === 'map' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-white'}
          >
            <Map className="h-4 w-4 mr-1" />
            Map
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-white'}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === 'split' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('split')}
            className={viewMode === 'split' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-white'}
          >
            Split View
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-white"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-full pt-16">
        {/* Map View */}
        {(viewMode === 'map' || viewMode === 'split') && (
          <div className={cn(
            "relative",
            viewMode === 'split' ? 'w-1/2' : 'w-full'
          )}>
            <div ref={mapContainer} className="h-full" />
            
            {/* Property count */}
            <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg">
              <p className="text-sm font-medium">{properties.length} properties found</p>
            </div>
          </div>
        )}

        {/* List View */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div className={cn(
            "overflow-y-auto bg-gray-50",
            viewMode === 'split' ? 'w-1/2 border-l' : 'w-full',
            "p-4"
          )}>
            {renderPropertyList()}
          </div>
        )}
      </div>

      {/* Selected Property Detail */}
      {selectedProperty && viewMode === 'map' && (
        <Card className="absolute bottom-4 left-4 right-4 max-w-md mx-auto p-4 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{selectedProperty.name}</h3>
              <p className="text-sm text-gray-600">{selectedProperty.location}</p>
              {selectedProperty.monthlyRent && (
                <p className="text-teal-600 font-bold mt-1">${selectedProperty.monthlyRent}/mo</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProperty(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 flex gap-2">
            <Button 
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={() => window.location.href = `/dashboard/buyers/properties/${selectedProperty.id}`}
            >
              View Details
            </Button>
            <Button variant="outline" className="flex-1">
              Schedule Tour
            </Button>
          </div>
        </Card>
      )}

      {/* Filters Modal */}
      {showFilters && (
        <SearchFilters
          isModal
          onClose={() => setShowFilters(false)}
          onFilterChange={(filters) => {
            onFiltersChange?.(filters)
            setShowFilters(false)
          }}
        />
      )}
    </div>
  )
}