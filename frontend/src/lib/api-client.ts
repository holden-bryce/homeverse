import { cookies } from 'next/headers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ApiOptions extends RequestInit {
  token?: string
}

export async function apiClient(endpoint: string, options: ApiOptions = {}) {
  const cookieStore = cookies()
  const token = cookieStore.get('access_token')?.value || options.token

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `API error: ${response.status}`)
  }

  return response.json()
}

// Project API calls
export const projectsAPI = {
  async list() {
    return apiClient('/api/v1/projects')
  },

  async get(id: string) {
    return apiClient(`/api/v1/projects/${id}`)
  },

  async create(data: any) {
    return apiClient('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: any) {
    return apiClient(`/api/v1/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string) {
    return apiClient(`/api/v1/projects/${id}`, {
      method: 'DELETE',
    })
  },
}

// Applicant API calls
export const applicantsAPI = {
  async list() {
    return apiClient('/api/v1/applicants')
  },

  async get(id: string) {
    return apiClient(`/api/v1/applicants/${id}`)
  },

  async create(data: any) {
    return apiClient('/api/v1/applicants', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: any) {
    return apiClient(`/api/v1/applicants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string) {
    return apiClient(`/api/v1/applicants/${id}`, {
      method: 'DELETE',
    })
  },
}

// Application API calls
export const applicationsAPI = {
  async list() {
    return apiClient('/api/v1/applications')
  },

  async create(data: any) {
    return apiClient('/api/v1/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateStatus(id: string, status: string) {
    return apiClient(`/api/v1/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}

// Investment API calls
export const investmentsAPI = {
  async list() {
    return apiClient('/api/v1/investments')
  },

  async create(data: any) {
    return apiClient('/api/v1/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getPortfolio() {
    return apiClient('/api/v1/lenders/portfolio')
  },
}

// User API calls
export const userAPI = {
  async getProfile() {
    return apiClient('/api/v1/auth/me')
  },

  async updateProfile(data: any) {
    return apiClient('/api/v1/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async updateSettings(data: any) {
    return apiClient('/api/v1/users/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}

// Analytics API calls
export const analyticsAPI = {
  async getDeveloperOverview() {
    return apiClient('/api/v1/analytics/developer/overview')
  },

  async getLenderOverview() {
    return apiClient('/api/v1/analytics/lender/overview')
  },

  async getHeatmapData() {
    return apiClient('/api/v1/analytics/heatmap')
  },
}

// Contact API
export const contactAPI = {
  async submit(data: any) {
    return apiClient('/api/v1/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}