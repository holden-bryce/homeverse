'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp, MapPin, DollarSign, Home, Users, Building } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface SearchFiltersProps {
  onFilterChange: (filters: SearchFilters) => void
  onClose?: () => void
  isModal?: boolean
}

export interface SearchFilters {
  priceRange: [number, number]
  amiLevels: string[]
  bedrooms: string[]
  bathrooms: string[]
  propertyTypes: string[]
  amenities: string[]
  location: {
    center?: [number, number]
    radius: number
    address?: string
  }
  status: string[]
  sortBy: string
}

const defaultFilters: SearchFilters = {
  priceRange: [0, 5000],
  amiLevels: [],
  bedrooms: [],
  bathrooms: [],
  propertyTypes: [],
  amenities: [],
  location: {
    radius: 10
  },
  status: [],
  sortBy: 'match_score'
}

export function SearchFilters({ onFilterChange, onClose, isModal = false }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    ami: true,
    bedBath: true,
    propertyType: true,
    amenities: false,
    status: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
    const currentValues = filters[key] as string[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    updateFilter(key, newValues as any)
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  const activeFilterCount = 
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000 ? 1 : 0) +
    filters.amiLevels.length +
    filters.bedrooms.length +
    filters.bathrooms.length +
    filters.propertyTypes.length +
    filters.amenities.length +
    filters.status.length

  const content = (
    <div className="space-y-4">
      {/* Price Range */}
      <div className="border-b pb-4">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <h3 className="font-semibold">Monthly Rent</h3>
          </div>
          {expandedSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expandedSections.price && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>${filters.priceRange[0]}</span>
              <span>${filters.priceRange[1]}+</span>
            </div>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
              min={0}
              max={5000}
              step={100}
              className="w-full"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Min</Label>
                <Input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Max</Label>
                <Input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 5000])}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AMI Levels */}
      <div className="border-b pb-4">
        <button
          onClick={() => toggleSection('ami')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <h3 className="font-semibold">AMI Levels</h3>
          </div>
          {expandedSections.ami ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expandedSections.ami && (
          <div className="mt-4 space-y-2">
            {['30% AMI', '50% AMI', '60% AMI', '80% AMI', '100% AMI', '120% AMI'].map(ami => (
              <label key={ami} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.amiLevels.includes(ami)}
                  onCheckedChange={() => toggleArrayFilter('amiLevels', ami)}
                />
                <span className="text-sm">{ami}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="border-b pb-4">
        <button
          onClick={() => toggleSection('bedBath')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <h3 className="font-semibold">Beds & Baths</h3>
          </div>
          {expandedSections.bedBath ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expandedSections.bedBath && (
          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Bedrooms</Label>
              <div className="flex flex-wrap gap-2">
                {['Studio', '1', '2', '3', '4+'].map(bed => (
                  <Button
                    key={bed}
                    variant={filters.bedrooms.includes(bed) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter('bedrooms', bed)}
                    className={filters.bedrooms.includes(bed) ? "bg-teal-600 hover:bg-teal-700" : ""}
                  >
                    {bed}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm mb-2 block">Bathrooms</Label>
              <div className="flex flex-wrap gap-2">
                {['1', '1.5', '2', '2.5', '3+'].map(bath => (
                  <Button
                    key={bath}
                    variant={filters.bathrooms.includes(bath) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayFilter('bathrooms', bath)}
                    className={filters.bathrooms.includes(bath) ? "bg-teal-600 hover:bg-teal-700" : ""}
                  >
                    {bath}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Property Type */}
      <div className="border-b pb-4">
        <button
          onClick={() => toggleSection('propertyType')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <h3 className="font-semibold">Property Type</h3>
          </div>
          {expandedSections.propertyType ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expandedSections.propertyType && (
          <div className="mt-4 space-y-2">
            {['Apartment', 'Condo', 'Townhouse', 'Single Family', 'Senior Housing'].map(type => (
              <label key={type} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.propertyTypes.includes(type)}
                  onCheckedChange={() => toggleArrayFilter('propertyTypes', type)}
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Amenities */}
      <div className="border-b pb-4">
        <button
          onClick={() => toggleSection('amenities')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="font-semibold">Amenities</h3>
          {expandedSections.amenities ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expandedSections.amenities && (
          <div className="mt-4 space-y-2">
            {['Parking', 'Laundry', 'Gym', 'Pool', 'Pet Friendly', 'Elevator', 'Balcony', 'Dishwasher', 'Air Conditioning'].map(amenity => (
              <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.amenities.includes(amenity)}
                  onCheckedChange={() => toggleArrayFilter('amenities', amenity)}
                />
                <span className="text-sm">{amenity}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="border-b pb-4">
        <button
          onClick={() => toggleSection('status')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="font-semibold">Availability</h3>
          {expandedSections.status ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expandedSections.status && (
          <div className="mt-4 space-y-2">
            {['Available Now', 'Coming Soon', 'Accepting Applications', 'Waitlist Open'].map(status => (
              <label key={status} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.status.includes(status)}
                  onCheckedChange={() => toggleArrayFilter('status', status)}
                />
                <span className="text-sm">{status}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sort By */}
      <div>
        <Label className="text-sm mb-2 block">Sort By</Label>
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="match_score">Best Match</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="available_units">Most Available Units</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={clearFilters}
          className="flex-1"
        >
          Clear All
        </Button>
        {isModal && (
          <Button
            onClick={onClose}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        )}
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md max-h-[90vh] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {content}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filters</CardTitle>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} active</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
}