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
  onPropertyHover?: (propertyId: string | null) => void
  onFiltersChange?: (filters: any) => void
}

export function PropertySearchMap({ properties, onPropertySelect, onPropertyHover, onFiltersChange }: PropertySearchMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'split'>('split')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const markers = useRef<mapboxgl.Marker[]>([])

  const addDemoMarkers = () => {
    if (!mapContainer.current) return
    
    const mapElement = mapContainer.current.querySelector('div')
    if (!mapElement) return

    // Clear existing demo markers
    const existingMarkers = mapElement.querySelectorAll('.demo-marker')
    existingMarkers.forEach(marker => marker.remove())

    // Add demo markers for properties
    properties.forEach((property, index) => {
      const markerEl = document.createElement('div')
      markerEl.className = 'demo-marker'
      markerEl.style.cssText = `
        width: 40px;
        height: 40px;
        background: ${property.matchScore && property.matchScore >= 80 ? '#0d9488' : '#6b7280'};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        position: absolute;
        top: ${Math.min(80, 30 + index * 40)}px;
        left: ${Math.min(300, 50 + index * 60)}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 12px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        transition: transform 0.2s;
        z-index: 10;
      `
      markerEl.textContent = property.availableUnits?.toString() || property.totalUnits.toString()
      markerEl.title = `${property.name} - ${property.location}`
      
      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.2)'
        if (onPropertyHover) onPropertyHover(property.id)
      })
      
      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)'
        if (onPropertyHover) onPropertyHover(null)
      })
      
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedProperty(property)
        onPropertySelect?.(property)
      })
      
      mapElement.appendChild(markerEl)
    })
  }

  useEffect(() => {
    if (!mapContainer.current) return

    console.log('Mapbox token:', mapboxgl.accessToken ? 'Set' : 'Not set')
    console.log('Token length:', mapboxgl.accessToken?.length || 0)
    
    if (!mapboxgl.accessToken || mapboxgl.accessToken === 'pk.placeholder' || mapboxgl.accessToken.length < 10) {
      console.warn('Mapbox token not available, using fallback map')
      // Create fallback map with demo markers
      if (mapContainer.current) {
        mapContainer.current.innerHTML = `
          <div class="w-full h-full bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center rounded-lg border relative">
            <div class="text-center text-gray-600">
              <div class="text-4xl mb-4">🗺️</div>
              <div class="text-lg font-semibold mb-2">Bay Area Properties</div>
              <div class="text-sm">Interactive map with ${properties.length} properties</div>
            </div>
          </div>
        `
        // Add demo markers
        setTimeout(() => addDemoMarkers(), 100)
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

  // Update demo markers when properties change (for fallback map)
  useEffect(() => {
    if (!mapboxgl.accessToken && mapContainer.current) {
      const mapElement = mapContainer.current.querySelector('div')
      if (mapElement) {
        setTimeout(() => addDemoMarkers(), 100)
      }
    }
  }, [properties.length]) // Only depend on length to avoid infinite re-renders

  // Update markers when properties change
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

      // Swap coordinates from [lat, lng] to [lng, lat] for Mapbox
      const marker = new mapboxgl.Marker(el)
        .setLngLat([property.coordinates[1], property.coordinates[0]])
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
        // Swap coordinates from [lat, lng] to [lng, lat] for Mapbox
        bounds.extend([property.coordinates[1], property.coordinates[0]])
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

