'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '@/lib/api-client-browser'
import { 
  Building2, 
  MapPin, 
  Users, 
  DollarSign,
  Eye,
  Heart,
  Star,
  X,
  Layers,
  Thermometer
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
  showHeatmap?: boolean
  heatmapType?: 'demand' | 'supply' | 'gap_analysis'
  onHeatmapToggle?: (enabled: boolean) => void
}

export function ProjectMap({
  projects = [],
  selectedProject,
  onProjectSelect,
  onProjectHover,
  height = 400,
  showControls = true,
  center = [-122.4194, 37.7749], // San Francisco Bay Area
  zoom = 10,
  showHeatmap = false,
  heatmapType = 'demand',
  onHeatmapToggle
}: ProjectMapProps) {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [selectedProjectData, setSelectedProjectData] = useState<Project | null>(null)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null)
  const [mapBounds, setMapBounds] = useState<{
    north: number; south: number; east: number; west: number;
  } | null>(null)

  // Fetch heatmap data
  const { data: heatmapData, isLoading: heatmapLoading, error: heatmapError } = useQuery({
    queryKey: ['heatmap', mapBounds, heatmapType],
    queryFn: async () => {
      if (!mapBounds) {
        console.log('No map bounds available for heatmap')
        return null
      }
      
      // Backend expects bounds in format: lat1,lng1,lat2,lng2
      const bounds = `${mapBounds.south},${mapBounds.west},${mapBounds.north},${mapBounds.east}`
      console.log('Fetching heatmap data with bounds:', bounds, 'Type:', heatmapType)
      
      try {
        const data = await analyticsAPI.getHeatmapData({
          data_type: heatmapType,
          bounds: bounds
        })
        console.log('Heatmap data received:', data)
        return data
      } catch (error) {
        console.error('Error fetching heatmap data:', error)
        throw error
      }
    },
    enabled: showHeatmap && !!mapBounds,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
  
  // Log heatmap error
  useEffect(() => {
    if (heatmapError) {
      console.error('Heatmap query error:', heatmapError)
    }
  }, [heatmapError])

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    // Check if we have a valid Mapbox token
    if (MAPBOX_TOKEN === 'pk.placeholder' || !MAPBOX_TOKEN || MAPBOX_TOKEN.length < 10) {
      // Show fallback map
      console.log('No valid Mapbox token found, using fallback map')
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
    console.log('Mapbox token:', MAPBOX_TOKEN.substring(0, 10) + '...')

    try {
      console.log('Initializing Mapbox map...')
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: center as [number, number],
        zoom: zoom,
        attributionControl: false
      })

      console.log('Mapbox map initialized successfully')

      // Add controls
      if (showControls) {
        map.current!.addControl(new mapboxgl.NavigationControl(), 'top-right')
      }

      // Wait for map to load before adding markers
      map.current!.on('load', () => {
        console.log('Mapbox map loaded, adding markers...')
        addProjectMarkers()
        
        // Update bounds when map moves
        map.current!.on('moveend', updateMapBounds)
        map.current!.on('zoomend', updateMapBounds)
        
        // Set initial bounds
        updateMapBounds()
      })

      // Add error handling for map events
      map.current!.on('error', (e) => {
        console.error('Mapbox map error:', e)
      })

    } catch (error) {
      console.error('Error initializing Mapbox:', error)
      // Fallback to demo implementation
      showFallbackMap()
    }

  }, [center, zoom, height, showControls]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateMapBounds = () => {
    if (!map.current) return
    
    const bounds = map.current.getBounds()
    if (bounds) {
      const newBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      }
      console.log('Map bounds updated:', newBounds)
      setMapBounds(newBounds)
    }
  }

  const addProjectMarkers = () => {
    if (!map.current) return

    console.log('Adding markers for projects:', projects.length)

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove())
    markers.current = {}

    // Add new markers for each project
    projects.forEach((project) => {
      console.log('Adding marker for project:', project.name, 'at coordinates:', project.coordinates)
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

      // Ensure coordinates are in [lng, lat] format for Mapbox
      let coords: [number, number]
      if (Array.isArray(project.coordinates) && project.coordinates.length === 2) {
        // Check if coordinates are in [lat, lng] format (common) and swap to [lng, lat] for Mapbox
        const [first, second] = project.coordinates
        // If first coordinate is > 90, it's likely longitude (should be second)
        if (Math.abs(first) > Math.abs(second) && Math.abs(first) > 90) {
          coords = [first, second] // Already [lng, lat]
        } else {
          coords = [second, first] // Swap from [lat, lng] to [lng, lat]
        }
      } else {
        coords = [-122.4194, 37.7749] // Default to SF
      }

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(coords)
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

  const addHeatmapLayer = () => {
    if (!map.current || !heatmapData || !map.current.isStyleLoaded()) {
      console.log('Cannot add heatmap layer:', { 
        hasMap: !!map.current, 
        hasData: !!heatmapData, 
        isStyleLoaded: map.current?.isStyleLoaded() 
      })
      return
    }

    console.log('Adding heatmap layer with data:', {
      projects: heatmapData.projects?.length || 0,
      demand_zones: heatmapData.demand_zones?.length || 0
    })

    try {
      // Remove existing heatmap layers
      if (map.current.getLayer('heatmap-layer')) {
        map.current.removeLayer('heatmap-layer')
      }
      if (map.current.getLayer('heatmap-points')) {
        map.current.removeLayer('heatmap-points')
      }
      if (map.current.getSource('heatmap-source')) {
        map.current.removeSource('heatmap-source')
      }

      // Transform data to GeoJSON format
      const features: any[] = []
      
      // Add project locations
      if (heatmapData.projects) {
        heatmapData.projects.forEach((project: any) => {
          features.push({
            type: 'Feature',
            properties: {
              type: 'project',
              name: project.name,
              value: project.affordable_units / Math.max(project.units, 1),
              intensity: Math.min(project.affordable_units / 50, 1), // Normalize to 0-1
              description: `${project.name} - ${project.affordable_units} affordable units`,
              units: project.units,
              affordable_units: project.affordable_units,
            },
            geometry: {
              type: 'Point',
              coordinates: [project.lng, project.lat]
            }
          })
        })
      }

      // Add demand zones
      if (heatmapData.demand_zones) {
        heatmapData.demand_zones.forEach((zone: any) => {
          features.push({
            type: 'Feature',
            properties: {
              type: 'demand',
              value: zone.intensity,
              intensity: zone.intensity,
              description: 'Applicant demand zone'
            },
            geometry: {
              type: 'Point',
              coordinates: [zone.lng, zone.lat]
            }
          })
        })
      }

      const geojsonData = {
        type: 'FeatureCollection',
        features
      }

      console.log('Adding heatmap layer with', features.length, 'features')

      // Add source
      map.current.addSource('heatmap-source', {
        type: 'geojson',
        data: geojsonData as any
      })

      // Add heatmap layer
      map.current.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-source',
        maxzoom: 15,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            1, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            9, 3,
            15, 5
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(13,148,136,0)',
            0.2, 'rgba(103,207,169,0.4)',
            0.4, 'rgba(209,229,240,0.6)',
            0.6, 'rgba(253,219,199,0.8)',
            0.8, 'rgba(239,138,98,0.9)',
            1, 'rgba(178,24,43,1)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 20,
            9, 40,
            15, 60
          ],
          'heatmap-opacity': 0.7
        }
      }, 'waterway-label') // Insert below labels

      // Add circle layer for higher zoom levels  
      map.current.addLayer({
        id: 'heatmap-points',
        type: 'circle',
        source: 'heatmap-source',
        minzoom: 14,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 4,
            1, 12
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'type'], 'project'],
            '#0d9488',
            '#f59e0b'
          ],
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2,
          'circle-opacity': 0.8
        }
      }, 'waterway-label')

      // Add click handlers for heatmap points
      map.current.on('click', 'heatmap-points', (e: any) => {
        const coordinates = e.features[0].geometry.coordinates.slice()
        const properties = e.features[0].properties

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="p-3">
              <h3 class="font-semibold text-sm">${properties.description || 'Data Point'}</h3>
              <p class="text-xs text-gray-600 mt-1">Type: ${properties.type}</p>
              <p class="text-xs text-gray-600">Intensity: ${(properties.intensity * 100).toFixed(1)}%</p>
              ${properties.units ? `<p class="text-xs text-gray-600">Units: ${properties.units}</p>` : ''}
            </div>
          `)
          .addTo(map.current!)
      })

      map.current.on('mouseenter', 'heatmap-points', () => {
        map.current!.getCanvas().style.cursor = 'pointer'
      })

      map.current.on('mouseleave', 'heatmap-points', () => {
        map.current!.getCanvas().style.cursor = ''
      })

    } catch (error) {
      console.error('Error adding heatmap layer:', error)
    }
  }

  const removeHeatmapLayer = () => {
    if (!map.current) return

    try {
      if (map.current.getLayer('heatmap-layer')) {
        map.current.removeLayer('heatmap-layer')
      }
      if (map.current.getLayer('heatmap-points')) {
        map.current.removeLayer('heatmap-points')
      }
      if (map.current.getSource('heatmap-source')) {
        map.current.removeSource('heatmap-source')
      }
    } catch (error) {
      console.error('Error removing heatmap layer:', error)
    }
  }

  // Update heatmap when data or visibility changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return

    if (showHeatmap && heatmapData) {
      addHeatmapLayer()
    } else {
      removeHeatmapLayer()
    }
  }, [showHeatmap, heatmapData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when projects change
  useEffect(() => {
    if (map.current && map.current.loaded()) {
      addProjectMarkers()
    }
  }, [projects]) // eslint-disable-line react-hooks/exhaustive-deps

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
          className="absolute z-50 w-80 pointer-events-none"
          style={{ 
            left: `${popupPosition.x}px`, 
            bottom: `${height - popupPosition.y + 10}px`
          }}
        >
          <Card className="border-0 shadow-xl bg-white pointer-events-auto">
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
                <Button 
                  size="sm" 
                  className="flex-1 bg-sage-600 hover:bg-sage-700 text-white rounded-full"
                  onClick={() => router.push(`/dashboard/projects/${selectedProjectData.id}`)}
                >
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
          {/* Heatmap Controls */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Heatmap</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => onHeatmapToggle?.(!showHeatmap)}
                >
                  <Thermometer className="h-3 w-3 mr-1" />
                  {showHeatmap ? 'Hide' : 'Show'}
                </Button>
              </div>
              {showHeatmap && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">
                    {heatmapLoading ? 'Loading...' : `${heatmapData?.statistics?.total_projects || 0} projects`}
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                    <span>Project Supply</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span>Applicant Demand</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Legend */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                <div className="text-xs font-medium mb-1">Project Status</div>
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