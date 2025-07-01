'use client'

import { createClient } from '@/lib/supabase'

// Use production API URL when on production domain
const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'homeverse-frontend.onrender.com'
  ? 'https://homeverse-api.onrender.com'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

interface ApiOptions extends RequestInit {
  requireAuth?: boolean
}

async function getAuthToken() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

export async function apiBrowserClient(endpoint: string, options: ApiOptions = {}) {
  const { requireAuth = true, ...fetchOptions } = options
  
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  // Add auth token if required
  if (requireAuth) {
    try {
      const token = await getAuthToken()
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Failed to get auth token:', error)
      // Continue without auth - let the API handle the 401
    }
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `API error: ${response.status}`)
  }

  return response.json()
}


// Matching API calls for browser
export const matchingAPI = {
  async getProjectMatches(projectId: string) {
    return apiBrowserClient(`/api/v1/projects/${projectId}/matches`)
  },

  async getApplicantMatches(applicantId: string) {
    return apiBrowserClient(`/api/v1/applicants/${applicantId}/matches`)
  },

  async runMatching(projectId?: string) {
    const endpoint = projectId 
      ? `/api/v1/projects/${projectId}/matches` 
      : '/api/v1/matching/run'
    
    return apiBrowserClient(endpoint, {
      method: 'POST'
    })
  },
}

// Projects API calls for browser
export const projectsAPI = {
  async list() {
    return apiBrowserClient('/api/v1/projects')
  },

  async get(id: string) {
    return apiBrowserClient(`/api/v1/projects/${id}`)
  },
}

// Applicants API calls for browser
export const applicantsAPI = {
  async list() {
    return apiBrowserClient('/api/v1/applicants')
  },

  async get(id: string) {
    return apiBrowserClient(`/api/v1/applicants/${id}`)
  },
}

// Analytics API calls for browser
export const analyticsAPI = {
  async getDeveloperOverview() {
    return apiBrowserClient('/api/v1/analytics/developer/overview')
  },

  async getLenderOverview() {
    return apiBrowserClient('/api/v1/analytics/lender/overview')
  },

  async getHeatmapData(params: { 
    data_type?: string; 
    bounds?: string; 
  } = {}) {
    const searchParams = new URLSearchParams()
    if (params.data_type) searchParams.append('data_type', params.data_type)
    if (params.bounds) searchParams.append('bounds', params.bounds)
    
    const query = searchParams.toString()
    const endpoint = query ? `/api/v1/analytics/heatmap?${query}` : '/api/v1/analytics/heatmap'
    
    return apiBrowserClient(endpoint)
  },
}