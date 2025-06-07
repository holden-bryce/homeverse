'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, MapPin, Bed, Bath, Square, DollarSign, Home, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PropertyCardProps {
  property: {
    id: string
    name: string
    address: string
    location: string
    images?: string[]
    price?: number
    monthlyRent?: number
    bedrooms?: number
    bathrooms?: number
    sqft?: number
    amiLevels: string
    availableUnits?: number
    totalUnits: number
    status: string
    completionDate?: string
    matchScore?: number
    developer?: string
  }
  variant?: 'grid' | 'list'
  onFavorite?: (id: string) => void
  isFavorited?: boolean
}

export function PropertyCard({ property, variant = 'grid', onFavorite, isFavorited = false }: PropertyCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'coming soon':
      case 'planning':
        return 'bg-blue-100 text-blue-800'
      case 'waitlist':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 70) return 'text-teal-600 bg-teal-50 border-teal-200'
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  if (variant === 'list') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex">
          <div className="relative w-80 h-64">
            <Link href={`/dashboard/buyers/properties/${property.id}`}>
              <Image
                src={imageError ? 'https://via.placeholder.com/800x600.png?text=Property+Image' : (property.images?.[0] || 'https://via.placeholder.com/800x600.png?text=No+Image')}
                alt={property.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
              {property.matchScore && (
                <div className={cn(
                  "absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-semibold border",
                  getMatchScoreColor(property.matchScore)
                )}>
                  {property.matchScore}% Match
                </div>
              )}
            </Link>
          </div>
          
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <Link href={`/dashboard/buyers/properties/${property.id}`}>
                  <h3 className="text-xl font-semibold hover:text-teal-600 transition-colors">
                    {property.name}
                  </h3>
                </Link>
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{property.location}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFavorite?.(property.id)}
                className="hover:bg-gray-100"
              >
                <Heart className={cn("h-5 w-5", isFavorited ? "fill-red-500 text-red-500" : "text-gray-400")} />
              </Button>
            </div>

            <div className="flex items-center gap-6 mb-4">
              {property.monthlyRent && (
                <div className="text-2xl font-bold text-teal-600">
                  {formatPrice(property.monthlyRent)}/mo
                </div>
              )}
              <Badge className={getStatusColor(property.status)}>
                {property.status}
              </Badge>
              <Badge variant="outline">
                AMI: {property.amiLevels}
              </Badge>
            </div>

            <div className="flex items-center gap-6 text-gray-600 mb-4">
              {property.bedrooms && (
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  <span>{property.bedrooms} beds</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  <span>{property.bathrooms} baths</span>
                </div>
              )}
              {property.sqft && (
                <div className="flex items-center gap-1">
                  <Square className="h-4 w-4" />
                  <span>{property.sqft} sqft</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>{property.availableUnits || property.totalUnits} units available</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {property.developer && `Developed by ${property.developer}`}
              </p>
              <Link href={`/dashboard/buyers/properties/${property.id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Grid variant (default)
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-64">
        <Link href={`/dashboard/buyers/properties/${property.id}`}>
          <Image
            src={imageError ? 'https://via.placeholder.com/800x600.png?text=Property+Image' : (property.images?.[0] || 'https://via.placeholder.com/800x600.png?text=No+Image')}
            alt={property.name}
            fill
            className={cn(
              "object-cover transition-transform duration-300",
              isHovered && "scale-105"
            )}
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {property.matchScore && (
            <div className={cn(
              "absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-semibold border",
              getMatchScoreColor(property.matchScore)
            )}>
              {property.matchScore}% Match
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              onFavorite?.(property.id)
            }}
            className="absolute top-3 right-3 bg-white/80 hover:bg-white"
          >
            <Heart className={cn("h-5 w-5", isFavorited ? "fill-red-500 text-red-500" : "text-gray-600")} />
          </Button>
          
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-xl font-semibold text-white mb-1">{property.name}</h3>
            <div className="flex items-center text-white/90">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{property.location}</span>
            </div>
          </div>
        </Link>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          {property.monthlyRent && (
            <div className="text-2xl font-bold text-teal-600">
              {formatPrice(property.monthlyRent)}/mo
            </div>
          )}
          <Badge className={getStatusColor(property.status)}>
            {property.status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          {property.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.sqft && (
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              <span>{property.sqft}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">AMI: {property.amiLevels}</span>
          <span className="text-gray-600">{property.availableUnits || property.totalUnits} units</span>
        </div>
        
        {property.completionDate && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
            <Calendar className="h-4 w-4" />
            <span>Available {new Date(property.completionDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </Card>
  )
}