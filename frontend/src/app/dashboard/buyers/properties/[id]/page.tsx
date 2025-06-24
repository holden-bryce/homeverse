import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PropertyDetailClient } from './property-detail-client'

// Transform database project to buyer-friendly property format
function transformProjectToProperty(project: any) {
  if (!project) {
    throw new Error('No project data provided')
  }
  
  console.log('Transforming project:', project)
  
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

  const rent = estimateRent(project.ami_levels || [], project.city || 'San Francisco')
  const bedrooms = estimateBedrooms(project.total_units || 100)
  
  // Process images from project_images table
  const projectImages = project.project_images || []
  let imageUrls = []
  
  if (projectImages.length > 0) {
    // Filter valid URLs and add fallbacks for broken ones
    imageUrls = projectImages
      .map((img: any) => img.url)
      .filter((url: string) => url && (url.startsWith('http') || url.startsWith('/')))
      .slice(0, 3) // Limit to 3 images max
  }
  
  // Always ensure we have at least 3 images with fallbacks
  while (imageUrls.length < 3) {
    imageUrls.push(`https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1545324418-cc1a3fa10c00' : '1560518883-ce09059eeffa'}?w=800&h=600&fit=crop&auto=format`)
  }
  
  return {
    id: project.id,
    name: project.name,
    address: project.address,
    location: `${project.city || 'San Francisco'}, ${project.state || 'CA'}`,
    coordinates: [project.latitude || 37.7749, project.longitude || -122.4194] as [number, number],
    images: imageUrls,
    monthlyRent: project.monthly_rent || rent,
    securityDeposit: project.security_deposit || rent * 2,
    applicationFee: project.application_fee || 50,
    bedrooms: project.bedrooms || bedrooms,
    bathrooms: project.bathrooms || (bedrooms === 1 ? 1 : 2),
    sqft: project.square_feet || bedrooms * 400 + 250,
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
      { name: 'Parking', icon: 'Car', included: project.parking === 'included' || project.parking === 'available' },
      { name: 'In-Unit Laundry', icon: 'Home', included: project.laundry === 'in_unit' },
      { name: 'Fitness Center', icon: 'Dumbbell', included: true },
      { name: 'Pet Friendly', icon: 'Heart', included: project.pet_policy !== 'no_pets' },
      { name: 'Pool', icon: 'Home', included: false },
      { name: 'Doorman', icon: 'Users', included: false },
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
    walkScore: project.walk_score || 85,
    transitScore: project.transit_score || 90,
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

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  console.log('PropertyDetailPage: Loading property with ID:', params.id)
  
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        companies(name),
        project_images(url)
      `)
      .eq('id', params.id)
      .single()
    
    console.log('PropertyDetailPage: Database response:', { project, error })
    
    if (error || !project) {
      console.error('Project not found:', error)
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
            <p>The property with ID {params.id} could not be found.</p>
            <p className="mt-2 text-sm text-gray-600">Error: {error?.message || 'Unknown error'}</p>
          </div>
        </div>
      )
    }
    
    console.log('PropertyDetailPage: Raw project data before transform:', project)
    const property = transformProjectToProperty(project)
    console.log('PropertyDetailPage: Transformed property data:', property)
    
    return <PropertyDetailClient property={property} />
  } catch (error) {
    console.error('Error loading property:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Property</h1>
          <p>An error occurred while loading the property details.</p>
          <p className="mt-2 text-sm text-gray-600">{String(error)}</p>
        </div>
      </div>
    )
  }
}