import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'

// Demo data - This endpoint allows admins to seed demo data
export async function POST(req: NextRequest) {
  try {
    const profile = await getUserProfile()
    
    // Only allow admins to seed data
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = createClient()
    const results = {
      applicants: 0,
      projects: 0,
      errors: []
    }
    
    // Demo Applicants
    const demoApplicants = [
      {
        full_name: 'Sarah Johnson',
        email: 'sarah.johnson@demo.homeverse.io',
        phone: '(415) 555-0101',
        income: 65000,
        household_size: 3,
        ami_percent: 80,
        location_preference: 'Mission District',
        latitude: 37.7599,
        longitude: -122.4148,
        status: 'approved',
        company_id: profile.company_id,
        user_id: profile.id
      },
      {
        full_name: 'Michael Chen',
        email: 'michael.chen@demo.homeverse.io',
        phone: '(415) 555-0102',
        income: 45000,
        household_size: 1,
        ami_percent: 55,
        location_preference: 'Sunset District',
        latitude: 37.7577,
        longitude: -122.5048,
        status: 'pending',
        company_id: profile.company_id,
        user_id: profile.id
      },
      {
        full_name: 'Maria Rodriguez',
        email: 'maria.rodriguez@demo.homeverse.io',
        phone: '(415) 555-0103',
        income: 72000,
        household_size: 4,
        ami_percent: 90,
        location_preference: 'Bayview',
        latitude: 37.7309,
        longitude: -122.3795,
        status: 'approved',
        company_id: profile.company_id,
        user_id: profile.id
      },
      {
        full_name: 'James Wilson',
        email: 'james.wilson@demo.homeverse.io',
        phone: '(415) 555-0104',
        income: 38000,
        household_size: 2,
        ami_percent: 45,
        location_preference: 'Excelsior',
        latitude: 37.7239,
        longitude: -122.4311,
        status: 'under_review',
        company_id: profile.company_id,
        user_id: profile.id
      },
      {
        full_name: 'Linda Davis',
        email: 'linda.davis@demo.homeverse.io',
        phone: '(415) 555-0105',
        income: 85000,
        household_size: 2,
        ami_percent: 100,
        location_preference: 'SOMA',
        latitude: 37.7785,
        longitude: -122.3892,
        status: 'approved',
        company_id: profile.company_id,
        user_id: profile.id
      }
    ]
    
    // Demo Projects
    const demoProjects = [
      {
        name: 'Sunset Heights Affordable Community',
        description: 'A new 150-unit affordable housing development in the heart of Sunset District, featuring modern amenities and easy transit access.',
        address: '1900 19th Avenue',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94122',
        total_units: 150,
        affordable_units: 120,
        ami_levels: ['50%', '60%', '80%'],
        status: 'active',
        latitude: 37.7577,
        longitude: -122.4788,
        price_range: '$1,200 - $2,400',
        bedrooms: 2,
        bathrooms: 1.5,
        square_feet: 850,
        unit_types: ['Studio', '1BR', '2BR'],
        monthly_rent: 1800,
        amenities: ['Gym', 'Community Room', 'Bike Storage', 'Playground'],
        pet_policy: 'Cats allowed, dogs under 25lbs',
        parking: '1 space per unit available',
        laundry: 'In-unit washer/dryer',
        application_fee: 50,
        security_deposit: 1800,
        move_in_cost: 3650,
        transit_notes: 'N-Judah line 2 blocks away, multiple bus lines nearby',
        school_district: 'San Francisco Unified School District',
        walk_score: 85,
        transit_score: 78,
        contact_email: 'leasing@sunsetheights.com',
        contact_phone: '(415) 555-1001',
        website: 'https://sunsetheights.com',
        company_id: profile.company_id,
        user_id: profile.id
      },
      {
        name: 'Mission Bay Senior Living',
        description: 'Senior housing community (55+) with 100 units, offering independent living with optional support services.',
        address: '500 Channel Street',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94158',
        total_units: 100,
        affordable_units: 80,
        ami_levels: ['30%', '50%', '60%'],
        status: 'active',
        latitude: 37.7664,
        longitude: -122.3903,
        price_range: '$900 - $1,800',
        bedrooms: 1,
        bathrooms: 1,
        square_feet: 650,
        unit_types: ['Studio', '1BR'],
        monthly_rent: 1200,
        amenities: ['Community Kitchen', 'Library', 'Medical Office', 'Emergency Call System'],
        pet_policy: 'Small pets welcome',
        parking: 'Limited parking available',
        laundry: 'Laundry room on each floor',
        application_fee: 35,
        security_deposit: 1200,
        move_in_cost: 2435,
        transit_notes: 'T-Third line nearby, shuttle service to medical appointments',
        walk_score: 90,
        transit_score: 85,
        contact_email: 'info@missionbaysenior.com',
        contact_phone: '(415) 555-1002',
        company_id: profile.company_id,
        user_id: profile.id
      },
      {
        name: 'Bayview Mixed-Income Development',
        description: 'Large-scale mixed-income community with 250 units, offering a range of affordability levels and unit sizes.',
        address: '3801 Third Street',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94124',
        total_units: 250,
        affordable_units: 150,
        ami_levels: ['30%', '50%', '80%', '120%'],
        status: 'construction',
        latitude: 37.7409,
        longitude: -122.3895,
        price_range: '$800 - $3,200',
        bedrooms: 2,
        bathrooms: 2,
        square_feet: 1100,
        unit_types: ['Studio', '1BR', '2BR', '3BR'],
        monthly_rent: 2000,
        estimated_delivery: '2024-09-01',
        amenities: ['Pool', 'Fitness Center', 'Business Center', 'Rooftop Garden'],
        pet_policy: 'Pet-friendly with deposit',
        parking: 'Garage parking included',
        laundry: 'In-unit washer/dryer',
        application_fee: 75,
        security_deposit: 2000,
        transit_notes: 'T-Third line adjacent, Caltrain shuttle',
        school_district: 'San Francisco Unified School District',
        walk_score: 72,
        transit_score: 75,
        contact_email: 'leasing@bayviewmixed.com',
        contact_phone: '(415) 555-1003',
        website: 'https://bayviewmixed.com',
        company_id: profile.company_id,
        user_id: profile.id
      }
    ]
    
    // Insert applicants
    for (const applicant of demoApplicants) {
      try {
        const { error } = await supabase
          .from('applicants')
          .insert(applicant)
        
        if (!error) {
          results.applicants++
        } else {
          results.errors.push(`Applicant ${applicant.full_name}: ${error.message}`)
        }
      } catch (e: any) {
        results.errors.push(`Applicant ${applicant.full_name}: ${e.message}`)
      }
    }
    
    // Insert projects
    for (const project of demoProjects) {
      try {
        const { error } = await supabase
          .from('projects')
          .insert(project)
        
        if (!error) {
          results.projects++
        } else {
          results.errors.push(`Project ${project.name}: ${error.message}`)
        }
      } catch (e: any) {
        results.errors.push(`Project ${project.name}: ${e.message}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Created ${results.applicants} applicants and ${results.projects} projects`,
      results
    })
    
  } catch (error: any) {
    console.error('Demo seed error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed demo data' },
      { status: 500 }
    )
  }
}