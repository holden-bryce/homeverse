'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
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

// Transform database project to buyer-friendly property format
function transformProjectToProperty(project: any) {
  // Estimate rent based on AMI levels and location
  const estimateRent = (amiLevels: string[], city: string) => {
    const basePrices: Record<string, number> = {
      'San Francisco': 3500,
      'Oakland': 2800,
      'San Jose': 3200,
      'Berkeley': 3000,
      'Fremont': 2500
    }
    
    const basePrice = basePrices[city] || 2800
    const hasLowAMI = amiLevels.some(level => level.includes('30') || level.includes('50'))
    
    return hasLowAMI ? Math.round(basePrice * 0.5) : Math.round(basePrice * 0.7)
  }
  
  // Estimate bedrooms based on total units
  const estimateBedrooms = (totalUnits: number) => {
    if (totalUnits < 50) return 1
    if (totalUnits < 150) return 2
    return 3
  }

  const rent = estimateRent(project.ami_levels || [], project.city)
  const bedrooms = estimateBedrooms(project.total_units)
  
  return {
    id: project.id,
    name: project.name,
    address: project.address,
    location: `${project.city}, ${project.state}`,
    coordinates: [project.latitude || 37.7749, project.longitude || -122.4194] as [number, number],
    images: project.images?.length > 0 ? project.images.map((img: any) => img.url) : [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
    ],
    monthlyRent: rent,
    securityDeposit: rent * 2,
    applicationFee: 50,
    bedrooms: bedrooms,
    bathrooms: bedrooms === 1 ? 1 : 2,
    sqft: bedrooms * 400 + 250,
    amiLevels: project.ami_levels?.join(', ') || 'Contact for details',
    availableUnits: project.affordable_units,
    totalUnits: project.total_units,
    status: project.status === 'active' ? 'Available' : project.status === 'planning' ? 'Coming Soon' : 'Available',
    completionDate: project.completion_date || '2024-12-31',
    matchScore: Math.floor(Math.random() * 20) + 80,
    developer: project.companies?.name || 'Affordable Housing Developer',
    propertyManager: 'Bay Area Property Management',
    yearBuilt: new Date(project.created_at).getFullYear(),
    amenities: [
      { name: 'Parking', icon: Car, included: true },
      { name: 'In-Unit Laundry', icon: Home, included: true },
      { name: 'Fitness Center', icon: Dumbbell, included: true },
      { name: 'Pet Friendly', icon: Heart, included: true },
      { name: 'Pool', icon: Home, included: false },
      { name: 'Doorman', icon: Users, included: false },
    ],
    description: project.description || `${project.name} offers modern, affordable housing in ${project.city}. This development features spacious units with contemporary finishes, energy-efficient appliances, and access to excellent public transportation.\n\nLocated in the heart of ${project.city}, residents enjoy easy access to local amenities, parks, and community resources. The property is designed with families in mind, offering community spaces and regular resident events.\n\nAll units feature modern kitchens with energy-efficient appliances, quality flooring, and large windows providing abundant natural light.`,
    nearbyTransit: [
      { type: 'Muni', lines: ['Local Transit'], distance: '0.3 miles' },
      { type: 'BART', station: 'Nearest Station', distance: '2.5 miles' },
    ],
    schools: [
      { name: 'Local Elementary', rating: 8, distance: '0.5 miles' },
      { name: 'Area Middle School', rating: 7, distance: '0.8 miles' },
      { name: 'Community High School', rating: 8, distance: '1.2 miles' },
    ],
    walkScore: 85,
    transitScore: 90,
    bikeScore: 80,
    neighborhood: {
      description: `${project.city} is known for its diverse community and excellent access to employment centers and amenities.`,
      demographics: {
        medianIncome: 75000,
        population: 50000,
        medianAge: 35,
      }
    },
    incomeRequirements: project.ami_levels?.map((ami: string, index: number) => {
      const percentage = parseInt(ami.split('-')[0] || ami.replace('%', ''))
      const minIncome = percentage * 1000
      const maxIncome = percentage * 1500
      const amiRent = Math.round(rent * (0.7 + index * 0.15))
      return {
        ami: ami,
        minIncome,
        maxIncome,
        monthlyRent: amiRent
      }
    }) || [
      { ami: '30%', minIncome: 25000, maxIncome: 35000, monthlyRent: Math.round(rent * 0.7) },
      { ami: '50%', minIncome: 35000, maxIncome: 58000, monthlyRent: Math.round(rent * 0.85) },
      { ami: '80%', minIncome: 58000, maxIncome: 93000, monthlyRent: rent },
    ],
    applicationProcess: [
      { step: 'Submit Application', description: 'Complete online application with required documents', completed: false },
      { step: 'Income Verification', description: 'Provide proof of income and employment', completed: false },
      { step: 'Background Check', description: 'Credit and criminal background screening', completed: false },
      { step: 'Interview', description: 'Meet with property management team', completed: false },
      { step: 'Final Approval', description: 'Receive housing offer', completed: false },
    ],
    requiredDocuments: [
      'Government-issued ID',
      'Proof of income (last 2 pay stubs)',
      'Bank statements (last 2 months)',
      'Employment verification letter',
      'Previous landlord references',
    ],
  }
}

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch real project data from database
  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { data: project, error } = await supabase
          .from('projects')
          .select('*, companies(name)')
          .eq('id', params.id)
          .single()
        
        if (error) {
          console.error('Error fetching project:', error)
          setError('Property not found')
          return
        }

        // Transform database project to buyer-friendly property
        const transformedProperty = transformProjectToProperty(project)
        setProperty(transformedProperty)
      } catch (error) {
        console.error('Error fetching project:', error)
        setError('Failed to load property')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProject()
    }
  }, [params.id])

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorited(savedFavorites.includes(params.id))
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The property you are looking for does not exist.'}</p>
          <Button 
            onClick={() => router.push('/dashboard/buyers')}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Back to Search
          </Button>
        </div>
      </div>
    )
  }

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
            <Image
              src={property.images[currentImageIndex]}
              alt={`${property.name} - Image ${currentImageIndex + 1}`}
              fill
              className="object-cover"
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
              {property.images.map((_, index) => (
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
                      {property.applicationProcess.map((step, index) => (
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
                      {property.amenities.map((amenity, index) => (
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
                      ))}
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
                        {property.nearbyTransit.map((transit, index) => (
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
                        {property.schools.map((school, index) => (
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
                      {property.incomeRequirements.map((req, index) => (
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
                      {property.requiredDocuments.map((doc, index) => (
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