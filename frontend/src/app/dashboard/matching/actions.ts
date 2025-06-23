'use server'

import { getUserProfile } from '@/lib/auth/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface MatchData {
  id: string
  applicant: {
    id: string
    name: string
    email: string
    phone?: string
    household_size: number
    annual_income: number
    ami_percentage: number
    preferences?: string[]
    location_preference?: string
  }
  project: {
    id: string
    name: string
    location: string
    unit_count: number
    ami_range: string
    available_units: number
  }
  score: number
  reasons: string[]
  status: string
  created_at: string
  ai_confidence: string
}

async function makeAPICall(endpoint: string) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()
  
  // Get current session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No authentication session found')
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }

  return response.json()
}

export async function getProjectMatches(projectId: string): Promise<MatchData[]> {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }

    const data = await makeAPICall(`/api/v1/projects/${projectId}/matches`)
    
    // Transform backend data to match frontend interface
    return data.map((match: any) => ({
      id: match.id,
      applicant: {
        id: match.applicant_id,
        name: match.applicant_name || 'Unknown',
        email: match.applicant_email || '',
        phone: match.applicant_phone,
        household_size: match.household_size || 1,
        annual_income: match.annual_income || 0,
        ami_percentage: match.ami_percentage || 0,
        preferences: match.preferences || [],
        location_preference: match.location_preference
      },
      project: {
        id: match.project_id,
        name: match.project_name || 'Unknown Project',
        location: match.project_location || '',
        unit_count: match.total_units || 0,
        ami_range: match.ami_range || '',
        available_units: match.available_units || 0
      },
      score: Math.round(match.score * 100), // Convert 0-1 to 0-100
      reasons: match.reasons || [],
      status: match.status || 'new',
      created_at: match.created_at || new Date().toISOString(),
      ai_confidence: match.confidence || 'medium'
    }))
  } catch (error) {
    console.error('Error fetching project matches:', error)
    throw error
  }
}

export async function getApplicantMatches(applicantId: string): Promise<MatchData[]> {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }

    const data = await makeAPICall(`/api/v1/applicants/${applicantId}/matches`)
    
    // Transform backend data to match frontend interface
    return data.map((match: any) => ({
      id: match.id,
      applicant: {
        id: match.applicant_id,
        name: match.applicant_name || 'Unknown',
        email: match.applicant_email || '',
        phone: match.applicant_phone,
        household_size: match.household_size || 1,
        annual_income: match.annual_income || 0,
        ami_percentage: match.ami_percentage || 0,
        preferences: match.preferences || [],
        location_preference: match.location_preference
      },
      project: {
        id: match.project_id,
        name: match.project_name || 'Unknown Project',
        location: match.project_location || '',
        unit_count: match.total_units || 0,
        ami_range: match.ami_range || '',
        available_units: match.available_units || 0
      },
      score: Math.round(match.score * 100), // Convert 0-1 to 0-100
      reasons: match.reasons || [],
      status: match.status || 'new',
      created_at: match.created_at || new Date().toISOString(),
      ai_confidence: match.confidence || 'medium'
    }))
  } catch (error) {
    console.error('Error fetching applicant matches:', error)
    throw error
  }
}

export async function getAllMatches(): Promise<MatchData[]> {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }

    // For all matches, we'll get matches for all projects
    const projectsData = await makeAPICall('/api/v1/projects')
    const allMatches: MatchData[] = []

    // Get matches for each project
    for (const project of projectsData.data || []) {
      try {
        const projectMatches = await getProjectMatches(project.id)
        allMatches.push(...projectMatches)
      } catch (error) {
        console.error(`Failed to get matches for project ${project.id}:`, error)
        // Continue with other projects
      }
    }

    return allMatches
  } catch (error) {
    console.error('Error fetching all matches:', error)
    throw error
  }
}

export async function runMatching(projectId?: string): Promise<void> {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }

    // For now, trigger matching by calling the matches endpoint
    // This will cause the backend to generate new matches
    if (projectId) {
      await makeAPICall(`/api/v1/projects/${projectId}/matches`)
    } else {
      // Run matching for all projects
      const projectsData = await makeAPICall('/api/v1/projects')
      for (const project of projectsData.data || []) {
        try {
          await makeAPICall(`/api/v1/projects/${project.id}/matches`)
        } catch (error) {
          console.error(`Failed to run matching for project ${project.id}:`, error)
        }
      }
    }
  } catch (error) {
    console.error('Error running matching:', error)
    throw error
  }
}

export async function updateMatchStatus(matchId: string, status: string, notes?: string): Promise<void> {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized - no user profile')
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createClient()
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No authentication session found')
    }

    // Update match status via backend API
    await fetch(`${API_BASE_URL}/api/v1/matches/${matchId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        notes
      })
    })
  } catch (error) {
    console.error('Error updating match status:', error)
    throw error
  }
}