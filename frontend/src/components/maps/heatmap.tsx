'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { useHeatmap } from '@/lib/api/hooks'
import { 
  MapPin, 
  Layers, 
  Filter, 
  Download, 
  Maximize2,
  RotateCcw,
  Info
} from 'lucide-react'

declare global {
  interface Window {
    mapboxgl: any;
  }
}

interface HeatmapProps {
  className?: string
  height?: number
  showControls?: boolean
}

interface HeatmapFilters {
  data_type: 'ami_compliance' | 'investment_density' | 'opportunity_zones' | 'demographics'
  time_period: '1M' | '3M' | '6M' | '1Y' | 'ALL'
  ami_band?: string
}

const DEFAULT_CENTER = [-122.4194, 37.7749] // San Francisco
const DEFAULT_ZOOM = 10

export default function Heatmap({ className = '', height = 400, showControls = true }: HeatmapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [filters, setFilters] = useState<HeatmapFilters>({
    data_type: 'investment_density',
    time_period: '6M'
  })
  const [bounds, setBounds] = useState({
    north: 37.8324,
    south: 37.7174,
    east: -122.3482,
    west: -122.4908
  })

  const { data: heatmapData, isLoading } = useHeatmap(bounds)

  // Load Mapbox
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.mapboxgl) {
      const script = document.createElement('script')
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
      script.onload = () => setIsLoaded(true)
      document.head.appendChild(script)

      const link = document.createElement('link')
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    } else if (window.mapboxgl) {
      setIsLoaded(true)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapContainer.current || map.current) return

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    
    if (!accessToken || accessToken === 'pk.your_mapbox_token_here' || accessToken === 'undefined') {
      console.warn('Mapbox token not configured. Using fallback visualization.')
      // Create a simple fallback visualization
      createFallbackMap()
      return
    }

    window.mapboxgl.accessToken = accessToken

    map.current = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v10',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM
    })

    map.current.on('load', () => {
      // Add navigation controls
      map.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right')
      
      // Update bounds when map moves
      map.current.on('moveend', () => {
        const mapBounds = map.current.getBounds()
        setBounds({
          north: mapBounds.getNorth(),
          south: mapBounds.getSouth(),
          east: mapBounds.getEast(),
          west: mapBounds.getWest()
        })
      })
      
      // Mark map as ready for data
      setMapReady(true)
    })

    map.current.on('styledata', () => {
      // Style has loaded/changed, safe to add sources
      setMapReady(true)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        setMapReady(false)
      }
    }
  }, [isLoaded])

  const createFallbackMap = () => {
    if (!mapContainer.current) return
    
    // Create a simple canvas-based visualization
    mapContainer.current.innerHTML = `
      <div class="w-full h-full bg-gray-100 relative overflow-hidden rounded-lg border">
        <div class="absolute inset-0 bg-gradient-to-br from-teal-50 to-green-50">
          <!-- Bay Area outline -->
          <svg class="w-full h-full" viewBox="0 0 400 300" id="fallback-svg">
            <!-- SF Bay outline -->
            <path d="M50 150 Q 120 130 200 140 Q 280 150 350 160 Q 340 200 300 220 Q 250 240 200 235 Q 150 230 100 210 Q 60 190 50 150 Z" 
                  fill="#e0f2fe" stroke="#0d9488" stroke-width="2" opacity="0.6"/>
            
            <!-- Land masses -->
            <rect x="20" y="50" width="360" height="100" fill="#f3f4f6" opacity="0.8" rx="10"/>
            <rect x="20" y="200" width="360" height="80" fill="#f3f4f6" opacity="0.8" rx="10"/>
            
            <!-- Data points container -->
            <g id="data-points"></g>
          </svg>
          
          <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div class="text-sm font-medium text-gray-700 mb-2">San Francisco Bay Area</div>
            <div class="text-xs text-gray-500">Heatmap Visualization</div>
          </div>
          
          <div class="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-600">
            Configure NEXT_PUBLIC_MAPBOX_TOKEN for interactive maps
          </div>
        </div>
      </div>
    `
  }

  const renderFallbackDataPoints = () => {
    if (!mapContainer.current || !heatmapData) return
    
    const svg = mapContainer.current.querySelector('#fallback-svg')
    const pointsGroup = svg?.querySelector('#data-points')
    
    if (!pointsGroup) return
    
    // Clear existing points
    pointsGroup.innerHTML = ''
    
    // Map coordinates to SVG viewBox (400x300)
    const latToY = (lat: number) => {
      // SF Bay Area: lat 37.4 to 37.9 -> SVG y 250 to 50
      return 250 - ((lat - 37.4) / 0.5) * 200
    }
    
    const lngToX = (lng: number) => {
      // SF Bay Area: lng -122.7 to -122.1 -> SVG x 20 to 380
      return 20 + ((lng + 122.7) / 0.6) * 360
    }
    
    // Add data points
    heatmapData.forEach((point: any, index: number) => {
      const x = lngToX(point.lng)
      const y = latToY(point.lat)
      const radius = 3 + (point.intensity * 2)
      const opacity = 0.6 + (point.intensity * 0.1)
      
      const color = point.intensity >= 5 ? '#ef4444' : 
                   point.intensity >= 3 ? '#f59e0b' : '#6b8e3a'
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', x.toString())
      circle.setAttribute('cy', y.toString())
      circle.setAttribute('r', radius.toString())
      circle.setAttribute('fill', color)
      circle.setAttribute('opacity', opacity.toString())
      circle.setAttribute('stroke', 'white')
      circle.setAttribute('stroke-width', '1')
      
      // Add tooltip on hover
      circle.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div')
        tooltip.className = 'absolute bg-black text-white text-xs rounded p-2 pointer-events-none z-10'
        tooltip.style.left = `${e.pageX + 10}px`
        tooltip.style.top = `${e.pageY - 30}px`
        tooltip.innerHTML = `
          <div class="font-medium">${point.description}</div>
          <div>Value: ${point.value}</div>
          <div>Intensity: ${point.intensity}</div>
        `
        document.body.appendChild(tooltip)
        
        circle.addEventListener('mouseleave', () => {
          document.body.removeChild(tooltip)
        }, { once: true })
      })
      
      pointsGroup.appendChild(circle)
    })
  }

  // Update heatmap data
  useEffect(() => {
    if (!heatmapData) return

    // If using fallback map, render data points on it
    if (!map.current && mapContainer.current && mapContainer.current.querySelector('#fallback-svg')) {
      renderFallbackDataPoints()
      return
    }

    if (!map.current || !mapReady) return

    // Check if map style is loaded
    if (!map.current.isStyleLoaded()) {
      console.warn('Map style not ready, retrying...')
      setTimeout(() => {
        // Retry after style loads
        if (map.current && map.current.isStyleLoaded()) {
          setMapReady(true)
        }
      }, 100)
      return
    }

    try {
      // Remove existing heatmap layers
      if (map.current.getLayer('heatmap-layer')) {
        map.current.removeLayer('heatmap-layer')
      }
      if (map.current.getSource('heatmap-source')) {
        map.current.removeSource('heatmap-source')
      }

      // Add new heatmap data
      map.current.addSource('heatmap-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: heatmapData.map((point: any) => ({
          type: 'Feature',
          properties: {
            intensity: point.intensity,
            value: point.value,
            description: point.description
          },
          geometry: {
            type: 'Point',
            coordinates: [point.lng, point.lat]
          }
        }))
      }
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
          0.2, 'rgb(103,207,169)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 20,
          9, 40,
          15, 60
        ],
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 1,
          15, 0
        ]
      }
    })

    // Add circle layer for higher zoom levels
    map.current.addLayer({
      id: 'heatmap-point',
      type: 'circle',
      source: 'heatmap-source',
      minzoom: 14,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          1, 4,
          6, 10
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          1, '#6b8e3a',
          3, '#f59e0b',
          6, '#ef4444'
        ],
        'circle-stroke-color': 'white',
        'circle-stroke-width': 1,
        'circle-opacity': 0.8
      }
    })

    // Add click handlers
    map.current.on('click', 'heatmap-point', (e: any) => {
      const coordinates = e.features[0].geometry.coordinates.slice()
      const properties = e.features[0].properties

      new window.mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold">${properties.description || 'Data Point'}</h3>
            <p class="text-sm text-gray-600">Value: ${properties.value}</p>
            <p class="text-sm text-gray-600">Intensity: ${properties.intensity}</p>
          </div>
        `)
        .addTo(map.current)
    })

    map.current.on('mouseenter', 'heatmap-point', () => {
      map.current.getCanvas().style.cursor = 'pointer'
    })

    map.current.on('mouseleave', 'heatmap-point', () => {
      map.current.getCanvas().style.cursor = ''
    })

    } catch (error) {
      console.error('Error adding heatmap data:', error)
      // Fallback to retry after a delay
      setTimeout(() => setMapReady(true), 500)
    }

  }, [heatmapData, mapReady])

  const resetView = () => {
    if (map.current) {
      map.current.flyTo({
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM
      })
    }
  }

  const exportMap = () => {
    if (map.current) {
      const canvas = map.current.getCanvas()
      const link = document.createElement('a')
      link.download = `heatmap-${filters.data_type}-${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  if (!isLoaded) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Market Intelligence Heatmap</CardTitle>
          <CardDescription>Loading map visualization...</CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="bg-gray-100 rounded-lg flex items-center justify-center"
            style={{ height: `${height}px` }}
          >
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Loading Mapbox...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Market Intelligence Heatmap</CardTitle>
            <CardDescription>
              Geospatial analysis of investment opportunities and market conditions
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportMap}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showControls && (
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">Data Type</label>
              <Select
                value={filters.data_type}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  data_type: value as any 
                }))}
              >
                <option value="investment_density">Investment Density</option>
                <option value="ami_compliance">AMI Compliance</option>
                <option value="opportunity_zones">Opportunity Zones</option>
                <option value="demographics">Demographics</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600">Time Period</label>
              <Select
                value={filters.time_period}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  time_period: value as any 
                }))}
              >
                <option value="1M">Last Month</option>
                <option value="3M">Last 3 Months</option>
                <option value="6M">Last 6 Months</option>
                <option value="1Y">Last Year</option>
                <option value="ALL">All Time</option>
              </Select>
            </div>

            <div className="flex items-end space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Layers className="h-3 w-3" />
                <span>{filters.data_type.replace('_', ' ')}</span>
              </Badge>
              {isLoading && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-teal-500 rounded-full animate-pulse" />
                  <span>Loading...</span>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="relative">
          <div 
            ref={mapContainer}
            className="w-full rounded-lg overflow-hidden border"
            style={{ height: `${height}px` }}
          />
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Legend</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs">Low Density</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs">Medium Density</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs">High Density</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-sm text-gray-600">Data Points</div>
            <div className="text-lg font-semibold">
              {heatmapData ? heatmapData.length : 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Coverage Area</div>
            <div className="text-lg font-semibold">
              {Math.abs((bounds.north - bounds.south) * (bounds.east - bounds.west) * 3961).toFixed(1)} mi²
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Updated</div>
            <div className="text-lg font-semibold">Live</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}