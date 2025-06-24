import { createClient } from '@/lib/supabase/server'
import { BuyerPortalClient } from './buyer-portal-client'

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

  const rent = estimateRent(project.ami_levels || [], project.city || 'San Francisco')
  const bedrooms = estimateBedrooms(project.total_units || 100)
  
  return {
    id: project.id,
    name: project.name,
    address: project.address,
    location: `${project.city || 'San Francisco'}, ${project.state || 'CA'}`,
    coordinates: [project.latitude || 37.7749, project.longitude || -122.4194] as [number, number],
    images: project.images?.length > 0 ? project.images.map((img: any) => img.url) : [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
    ],
    monthlyRent: project.monthly_rent || rent,
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
    amenities: ['Parking', 'Laundry', 'Community Room', 'Affordable Housing'],
    description: project.description
  }
}

// Mock data for fallback
const mockProperties = [
  {
    id: '1',
    name: 'Sunset Gardens',
    address: '1234 Sunset Blvd',
    location: 'San Francisco, CA',
    coordinates: [37.7749, -122.4194] as [number, number],
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
    ],
    monthlyRent: 1800,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 850,
    amiLevels: '30-80%',
    availableUnits: 45,
    totalUnits: 120,
    status: 'Available',
    completionDate: '2024-12-31',
    matchScore: 92,
    developer: 'Affordable Housing Partners',
    amenities: ['Parking', 'Laundry', 'Community Room', 'Playground'],
    description: 'Modern affordable housing complex with excellent amenities.'
  },
  {
    id: '2',
    name: 'Riverside Commons',
    address: '5678 River Way',
    location: 'Oakland, CA',
    coordinates: [37.8044, -122.2712] as [number, number],
    images: [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop'
    ],
    monthlyRent: 1500,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    amiLevels: '50-100%',
    availableUnits: 22,
    totalUnits: 85,
    status: 'Available',
    completionDate: '2025-03-20',
    matchScore: 88,
    developer: 'East Bay Housing',
    amenities: ['Parking', 'Fitness Center', 'Rooftop Deck'],
    description: 'Waterfront community with stunning views.'
  },
  {
    id: '3',
    name: 'Harbor View Apartments',
    address: '9101 Harbor Dr',
    location: 'San Jose, CA',
    coordinates: [37.3382, -121.8863] as [number, number],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop'
    ],
    monthlyRent: 2200,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1200,
    amiLevels: '60-120%',
    availableUnits: 15,
    totalUnits: 200,
    status: 'Coming Soon',
    completionDate: '2025-08-30',
    matchScore: 85,
    developer: 'South Bay Developers',
    amenities: ['Parking', 'Pool', 'Business Center', 'Pet Park'],
    description: 'Family-friendly community in the heart of Silicon Valley.'
  }
]

export default async function BuyerPortalPage() {
  const supabase = createClient()
  
  // Fetch projects from database
  let properties = mockProperties
  
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        companies(name)
      `)
      .order('created_at', { ascending: false })
    
    if (!error && projects && projects.length > 0) {
      properties = projects.map(transformProjectToProperty)
      console.log('Loaded', properties.length, 'properties from database')
    } else {
      console.log('Using mock properties:', error?.message || 'No projects found')
    }
  } catch (error) {
    console.error('Error fetching projects:', error)
  }
  
  return <BuyerPortalClient initialProperties={properties} />
}