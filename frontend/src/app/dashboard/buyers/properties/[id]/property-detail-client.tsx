'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { 
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Square,
  DollarSign,
  Calendar,
  Users,
  Building2,
  Car,
  Train,
  GraduationCap,
  ShoppingBag,
  Trees,
  Dumbbell,
  Home,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Star,
  X
} from 'lucide-react'

interface PropertyDetailClientProps {
  property: any
}

export function PropertyDetailClient({ property }: PropertyDetailClientProps) {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Debug: log property data
  console.log('PropertyDetailClient: Received property data:', property)
  
  // Ensure property has required fields
  if (!property || !property.id) {
    console.error('PropertyDetailClient: Invalid property data received:', property)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Property Data</h1>
          <p>The property data could not be loaded correctly.</p>
        </div>
      </div>
    )
  }

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorited(savedFavorites.includes(property.id))
  }, [property.id])

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length)
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
  }

  const handleApply = () => {
    router.push(`/dashboard/buyers/apply/${property.id}`)
  }

  const handleScheduleTour = () => {
    toast({
      title: "Tour Request Sent",
      description: "The property manager will contact you within 24 hours to schedule your tour.",
    })
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link Copied",
      description: "Property link has been copied to your clipboard.",
    })
  }

  const toggleFavorite = () => {
    const newFavorited = !isFavorited
    setIsFavorited(newFavorited)
    
    // Update localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    const updatedFavorites = newFavorited 
      ? [...savedFavorites, property.id]
      : savedFavorites.filter((id: string) => id !== property.id)
    
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites))
    
    toast({
      title: newFavorited ? "Added to favorites" : "Removed from favorites",
      description: newFavorited ? "Property saved to your favorites." : "Property removed from your saved homes.",
    })
  }

  // Helper function to get icon component
  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Car, Home, Dumbbell, Heart, Users
    }
    return icons[iconName] || Home
  }

  // Handle image loading with fallback
  const getImageSrc = (src: string) => {
    if (!src || src.includes('placeholder') || src.includes('via.placeholder')) {
      return `https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&auto=format`
    }
    // Fix Unsplash URLs that might be causing issues
    if (src.includes('unsplash.com') && !src.includes('auto=format')) {
      return src + (src.includes('?') ? '&' : '?') + 'auto=format'
    }
    return src
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFavorite}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative bg-black">
        <div className="container mx-auto px-6">
          <div className="relative h-[400px] md:h-[500px]">
            <img
              src={getImageSrc(property.images[currentImageIndex])}
              alt={`${property.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log('Image failed to load:', e.currentTarget.src)
                e.currentTarget.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&auto=format'
              }}
            />
            <button
              onClick={previousImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <button
              onClick={() => setShowImageModal(true)}
              className="absolute bottom-4 right-4 bg-white/80 hover:bg-white px-4 py-2 rounded-full flex items-center gap-2"
            >
              <ZoomIn className="h-4 w-4" />
              View All Photos ({property.images.length})
            </button>
            
            {/* Image dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {property.images.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Property Info */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Basic Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.name}</h1>
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{property.address}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {property.status}
                    </Badge>
                    <Badge className="bg-teal-100 text-teal-800">
                      <Star className="h-4 w-4 mr-1" />
                      {property.matchScore}% Match
                    </Badge>
                    <Badge variant="outline">
                      AMI: {property.amiLevels}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-teal-600">
                    ${property.monthlyRent}/mo
                  </div>
                  <p className="text-sm text-gray-600">Starting from</p>
                </div>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-semibold">{property.bedrooms}</p>
                    <p className="text-sm text-gray-600">Bedrooms</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-semibold">{property.bathrooms}</p>
                    <p className="text-sm text-gray-600">Bathrooms</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Square className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-semibold">{property.sqft}</p>
                    <p className="text-sm text-gray-600">Sq Ft</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-semibold">{property.availableUnits}</p>
                    <p className="text-sm text-gray-600">Available</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="income">Income & Fees</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Property</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                      <div>
                        <p className="text-sm text-gray-500">Developer</p>
                        <p className="font-semibold">{property.developer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Property Manager</p>
                        <p className="font-semibold">{property.propertyManager}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Year Built</p>
                        <p className="font-semibold">{property.yearBuilt}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Units</p>
                        <p className="font-semibold">{property.totalUnits}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Application Process</CardTitle>
                    <CardDescription>5 steps to your new home</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {property.applicationProcess.map((step: any, index: number) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            step.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{step.step}</p>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="amenities" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Building Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {property.amenities.map((amenity: any, index: number) => {
                        const IconComponent = getIconComponent(amenity.icon)
                        return (
                          <div key={index} className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              amenity.included ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              {amenity.included ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <X className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <span className={amenity.included ? '' : 'text-gray-400'}>
                              {amenity.name}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="location" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Neighborhood & Transportation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">About {property.location}</h4>
                      <p className="text-gray-600">{property.neighborhood.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-teal-600">{property.walkScore}</div>
                        <p className="text-sm text-gray-600">Walk Score</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-teal-600">{property.transitScore}</div>
                        <p className="text-sm text-gray-600">Transit Score</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-teal-600">{property.bikeScore}</div>
                        <p className="text-sm text-gray-600">Bike Score</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Nearby Transit</h4>
                      <div className="space-y-2">
                        {property.nearbyTransit.map((transit: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Train className="h-5 w-5 text-gray-600" />
                              <div>
                                <p className="font-medium">{transit.type}</p>
                                <p className="text-sm text-gray-600">{transit.lines?.join(', ') || transit.station}</p>
                              </div>
                            </div>
                            <span className="text-sm text-gray-600">{transit.distance}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Nearby Schools</h4>
                      <div className="space-y-2">
                        {property.schools.map((school: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <GraduationCap className="h-5 w-5 text-gray-600" />
                              <div>
                                <p className="font-medium">{school.name}</p>
                                <p className="text-sm text-gray-600">Rating: {school.rating}/10</p>
                              </div>
                            </div>
                            <span className="text-sm text-gray-600">{school.distance}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="income" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Income Requirements</CardTitle>
                    <CardDescription>Based on Area Median Income (AMI)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {property.incomeRequirements.map((req: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{req.ami} AMI</Badge>
                            <span className="text-lg font-semibold text-teal-600">${req.monthlyRent}/mo</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Min Income</p>
                              <p className="font-medium">${req.minIncome.toLocaleString()}/year</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Max Income</p>
                              <p className="font-medium">${req.maxIncome.toLocaleString()}/year</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Fees & Deposits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Application Fee</span>
                        <span className="font-semibold">${property.applicationFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Security Deposit</span>
                        <span className="font-semibold">${property.securityDeposit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">First Month's Rent</span>
                        <span className="font-semibold">${property.monthlyRent}</span>
                      </div>
                      <div className="pt-3 border-t">
                        <div className="flex justify-between">
                          <span className="font-semibold">Total Move-in Cost</span>
                          <span className="font-semibold text-lg">
                            ${(property.applicationFee + property.securityDeposit + property.monthlyRent).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Required Documents</CardTitle>
                    <CardDescription>Have these ready for your application</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {property.requiredDocuments.map((doc: any, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                <div className="text-center pb-4 border-b">
                  <div className="text-3xl font-bold text-teal-600">${property.monthlyRent}/mo</div>
                  <p className="text-sm text-gray-600">{property.bedrooms} bed • {property.bathrooms} bath • {property.sqft} sqft</p>
                </div>

                <Button 
                  className="w-full bg-teal-600 hover:bg-teal-700" 
                  size="lg"
                  onClick={handleApply}
                >
                  Apply Now
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  onClick={handleScheduleTour}
                >
                  Schedule a Tour
                </Button>

                <div className="pt-4 space-y-3">
                  <h4 className="font-semibold">Contact Property</h4>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    (555) 123-4567
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Property
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Share this property</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={toggleFavorite}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}