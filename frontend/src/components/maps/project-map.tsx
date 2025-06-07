'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  MapPin, 
  Users, 
  DollarSign,
  Eye,
  Heart,
  Star,
  X
} from 'lucide-react'

// Mock Mapbox token - in production this would come from environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.placeholder'

interface Project {
  id: string
  name: string
  location: string
  coordinates: [number, number]
  ami_ranges: string[]
  unit_types: string[]
  units_available: number
  total_units: number
  status: string
  price_range: string
  match_score?: number
  is_saved?: boolean
}

interface ProjectMapProps {
  projects: Project[]
  selectedProject?: string
  onProjectSelect?: (projectId: string) => void
  onProjectHover?: (projectId: string | null) => void
  height?: number
  showControls?: boolean
  center?: [number, number]
  zoom?: number
}

export function ProjectMap({
  projects = [],
  selectedProject,
  onProjectSelect,
  onProjectHover,
  height = 400,
  showControls = true,
  center = [-122.4194, 37.7749], // San Francisco Bay Area
  zoom = 10
}: ProjectMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [selectedProjectData, setSelectedProjectData] = useState<Project | null>(null)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    // Check if we have a valid Mapbox token
    if (MAPBOX_TOKEN === 'pk.placeholder' || !MAPBOX_TOKEN || MAPBOX_TOKEN.length < 10) {
      // Show fallback map
      mapContainer.current.innerHTML = `
        <div style="
          width: 100%; 
          height: ${height}px; 
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #64748b;
          ">
            <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Interactive Map</div>
            <div style="font-size: 14px;">Mapbox integration will render here</div>
            <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
              Set NEXT_PUBLIC_MAPBOX_TOKEN to enable
            </div>
          </div>
        </div>
      `
      return
    }

    // Initialize real Mapbox map
    mapboxgl.accessToken = MAPBOX_TOKEN

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: center as [number, number],
        zoom: zoom,
        attributionControl: false
      })

      // Add controls
      if (showControls) {
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
      }

      // Wait for map to load before adding markers
      map.current.on('load', () => {
        addProjectMarkers()
      })

    } catch (error) {
      console.error('Error initializing Mapbox:', error)
      // Fallback to demo implementation
      showFallbackMap()
    }

  }, [center, zoom, height, showControls])

  const addProjectMarkers = () => {
    if (!map.current) return

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove())
    markers.current = {}

    // Add new markers for each project
    projects.forEach((project) => {
      const markerElement = document.createElement('div')
      markerElement.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: ${project.status === 'accepting_applications' ? '#16a34a' : 
                      project.status === 'construction' ? '#0d9488' : '#d97706'};
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 12px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        ">
          ${project.units_available || '?'}
        </div>
      `

      markerElement.addEventListener('click', () => {
        setSelectedProjectData(project)
        
        // Get marker position for popup
        const markerBounds = markerElement.getBoundingClientRect()
        const mapBounds = mapContainer.current?.getBoundingClientRect()
        if (mapBounds) {
          setPopupPosition({
            x: markerBounds.left - mapBounds.left + 20,
            y: markerBounds.top - mapBounds.top - 10
          })
        }
        onProjectSelect?.(project.id)
      })

      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)'
        onProjectHover?.(project.id)
      })

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)'
        onProjectHover?.(null)
      })

      // Swap coordinates from [lat, lng] to [lng, lat] for Mapbox
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([project.coordinates[1], project.coordinates[0]])
        .addTo(map.current!)

      markers.current[project.id] = marker
    })
  }

  const showFallbackMap = () => {
    if (!mapContainer.current) return
    
    mapContainer.current.innerHTML = `
      <div style="
        width: 100%; 
        height: ${height}px; 
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border-radius: 12px;
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: #64748b;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
          <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Bay Area Projects</div>
          <div style="font-size: 14px;">Interactive map with ${projects.length} projects</div>
        </div>
      </div>
    `
    
    // Add demo markers to fallback map
    setTimeout(() => {
      if (mapContainer.current) {
        const mapElement = mapContainer.current.querySelector('div')
        if (mapElement) {
          projects.forEach((project, index) => {
            const markerEl = document.createElement('div')
            markerEl.style.cssText = `
              width: 40px;
              height: 40px;
              background: ${project.status === 'accepting_applications' ? '#16a34a' : 
                          project.status === 'construction' ? '#0d9488' : '#d97706'};
              border: 3px solid white;
              border-radius: 50%;
              cursor: pointer;
              position: absolute;
              top: ${30 + index * 60}px;
              left: ${50 + index * 80}px;
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
            markerEl.textContent = project.units_available.toString()
            markerEl.title = project.name
            
            markerEl.addEventListener('mouseenter', () => {
              markerEl.style.transform = 'scale(1.2)'
              onProjectHover?.(project.id)
            })
            
            markerEl.addEventListener('mouseleave', () => {
              markerEl.style.transform = 'scale(1)'
              onProjectHover?.(null)
            })
            
            markerEl.addEventListener('click', (e) => {
              e.stopPropagation()
              setSelectedProjectData(project)
              const rect = markerEl.getBoundingClientRect()
              const containerRect = mapContainer.current?.getBoundingClientRect()
              if (containerRect) {
                setPopupPosition({
                  x: rect.left - containerRect.left + 20,
                  y: rect.top - containerRect.top - 10
                })
              }
              onProjectSelect?.(project.id)
            })
            
            mapElement.appendChild(markerEl)
          })
        }
      }
    }, 100)
  }

  // Update markers when projects change
  useEffect(() => {
    if (map.current && map.current.loaded()) {
      addProjectMarkers()
    }
  }, [projects])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove()
      }
    }

  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepting_applications':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'construction':
        return 'bg-teal-100 text-teal-800 border-teal-200'
      case 'planning':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="relative">
      <div ref={mapContainer} style={{ height }} className="rounded-xl overflow-hidden" />
      
      {/* Project Popup */}
      {selectedProjectData && popupPosition && (
        <div 
          className="absolute z-50 w-80"
          style={{ 
            left: popupPosition.x, 
            top: popupPosition.y,
            transform: 'translateY(-100%)'
          }}
        >
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{selectedProjectData.name}</h3>
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    {selectedProjectData.location}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-1"
                  onClick={() => {
                    setSelectedProjectData(null)
                    setPopupPosition(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <Badge className={`${getStatusColor(selectedProjectData.status)} rounded-full border text-xs`}>
                  {selectedProjectData.status.replace('_', ' ')}
                </Badge>
                {selectedProjectData.match_score && (
                  <Badge className="bg-sage-100 text-sage-800 border border-sage-200 rounded-full text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    {selectedProjectData.match_score}% match
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <div className="text-gray-500">Price Range</div>
                  <div className="font-semibold">{selectedProjectData.price_range}</div>
                </div>
                <div>
                  <div className="text-gray-500">Available Units</div>
                  <div className="font-semibold">
                    {selectedProjectData.units_available} of {selectedProjectData.total_units}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {selectedProjectData.ami_ranges.map((ami) => (
                  <Badge key={ami} className="bg-cream-100 text-cream-800 border border-cream-200 rounded-full text-xs">
                    {ami} AMI
                  </Badge>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button size="sm" className="flex-1 bg-sage-600 hover:bg-sage-700 text-white rounded-full">
                  <Eye className="mr-1 h-3 w-3" />
                  View Details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full p-2"
                >
                  <Heart className={`h-3 w-3 ${selectedProjectData.is_saved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-40 space-y-2">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Accepting Applications</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                  <span>Under Construction</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span>In Planning</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ProjectMap