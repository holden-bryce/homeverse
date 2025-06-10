import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/supabase-auth-provider'
import type {
  User,
  Company,
  Applicant,
  Project,
  Match,
  ReportRun,
  Investment,
  ApplicantForm,
  ProjectForm,
  InvestmentForm,
} from '@/types'

// Helper function to handle API calls
async function apiCall(path: string, options?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'API request failed')
  }

  return response.json()
}

// Applicant Hooks
export const useApplicants = (params?: {
  skip?: number
  limit?: number
  status?: string
  ami_band?: string
}) => {
  const { user } = useAuth()
  const searchParams = new URLSearchParams()
  if (params?.skip) searchParams.append('skip', params.skip.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.status) searchParams.append('status', params.status)
  if (params?.ami_band) searchParams.append('ami_band', params.ami_band)

  return useQuery({
    queryKey: ['applicants', params],
    queryFn: (): Promise<Applicant[]> =>
      apiCall(`/api/v1/applicants?${searchParams.toString()}`),
    enabled: !!user,
  })
}

export const useApplicant = (id: string) => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['applicant', id],
    queryFn: (): Promise<Applicant> => apiCall(`/api/v1/applicants/${id}`),
    enabled: !!id && !!user,
  })
}

export const useCreateApplicant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ApplicantForm): Promise<Applicant> =>
      apiCall('/api/v1/applicants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
    },
  })
}

export const useUpdateApplicant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApplicantForm> }): Promise<Applicant> =>
      apiCall(`/api/v1/applicants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
      queryClient.invalidateQueries({ queryKey: ['applicant', id] })
    },
  })
}

export const useDeleteApplicant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string): Promise<{ message: string }> =>
      apiCall(`/api/v1/applicants/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
    },
  })
}

// Project Hooks
export const useProjects = (params?: {
  skip?: number
  limit?: number
  status?: string
}) => {
  const { user } = useAuth()
  const searchParams = new URLSearchParams()
  if (params?.skip) searchParams.append('skip', params.skip.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.status) searchParams.append('status', params.status)

  return useQuery({
    queryKey: ['projects', params],
    queryFn: (): Promise<Project[]> =>
      apiCall(`/api/v1/projects?${searchParams.toString()}`),
    enabled: !!user,
  })
}

export const useAvailableProjects = (params?: {
  skip?: number
  limit?: number
}) => {
  const searchParams = new URLSearchParams()
  if (params?.skip) searchParams.append('skip', params.skip.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())

  return useQuery({
    queryKey: ['available-projects', params],
    queryFn: (): Promise<Project[]> =>
      apiCall(`/api/v1/projects/available?${searchParams.toString()}`),
  })
}

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: (): Promise<Project> => apiCall(`/api/v1/projects/${id}`),
    enabled: !!id,
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ProjectForm): Promise<Project> =>
      apiCall('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['available-projects'] })
    },
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectForm> }): Promise<Project> =>
      apiCall(`/api/v1/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['available-projects'] })
    },
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string): Promise<{ message: string }> =>
      apiCall(`/api/v1/projects/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['available-projects'] })
    },
  })
}

// Activities Hook
export const useActivities = (params?: {
  type?: string
  limit?: number
  offset?: number
}) => {
  const { user } = useAuth()
  const searchParams = new URLSearchParams()
  if (params?.type) searchParams.append('type', params.type)
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.offset) searchParams.append('offset', params.offset.toString())

  return useQuery({
    queryKey: ['activities', params],
    queryFn: (): Promise<{
      id: string
      type: string
      title: string
      description: string
      entity_type?: string
      entity_id?: string
      metadata?: any
      status?: string
      created_at: string
      user_email: string
    }[]> => apiCall(`/api/v1/activities?${searchParams.toString()}`),
    enabled: !!user,
  })
}

// Investment Hooks
export const useInvestments = (params?: {
  skip?: number
  limit?: number
  status?: string
  risk_level?: string
}) => {
  const { user } = useAuth()
  const searchParams = new URLSearchParams()
  if (params?.skip) searchParams.append('skip', params.skip.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.status) searchParams.append('status', params.status)
  if (params?.risk_level) searchParams.append('risk_level', params.risk_level)

  return useQuery({
    queryKey: ['investments', params],
    queryFn: (): Promise<Investment[]> =>
      apiCall(`/api/v1/lenders/investments?${searchParams.toString()}`),
    enabled: !!user,
  })
}

export const useCreateInvestment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: InvestmentForm): Promise<Investment> =>
      apiCall('/api/v1/lenders/investments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] })
    },
  })
}

export const usePortfolioStats = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['portfolio-stats'],
    queryFn: (): Promise<{
      total_invested: number
      current_portfolio_value: number
      average_roi: number
      active_investments: number
      total_return: number
      annualized_return: number
      compliance_rate: number
    }> => apiCall('/api/v1/lenders/portfolio/stats'),
    enabled: !!user,
  })
}

// Notification Hooks
export const useNotifications = (params?: {
  status?: string
  type?: string
  priority?: string
  skip?: number
  limit?: number
}) => {
  const { user } = useAuth()
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.append('status', params.status)
  if (params?.type) searchParams.append('type', params.type)
  if (params?.priority) searchParams.append('priority', params.priority)
  if (params?.skip) searchParams.append('skip', params.skip.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())

  return useQuery({
    queryKey: ['notifications', params],
    queryFn: (): Promise<{
      notifications: any[]
      unread_count: number
      total: number
    }> => apiCall(`/api/v1/notifications?${searchParams.toString()}`),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (notificationId: string): Promise<{ message: string }> =>
      apiCall(`/api/v1/notifications/${notificationId}/read`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (): Promise<{ message: string; updated_count: number }> =>
      apiCall('/api/v1/notifications/mark-all-read', {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// Contact Form Hook
export const useSubmitContact = () => {
  return useMutation({
    mutationFn: (data: {
      full_name: string
      email: string
      phone?: string
      user_type: string
      message: string
    }): Promise<{ message: string; submission_id: string }> =>
      apiCall('/api/v1/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  })
}

// Document Upload Hooks
export const useUploadDocument = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: FormData): Promise<any> => {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: data,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

// Report Hooks
export const useCreateReport = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { report_type: string; parameters: Record<string, any> }): Promise<ReportRun> =>
      apiCall('/api/v1/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export const useCRAReport = () => {
  return useMutation({
    mutationFn: (): Promise<any> => apiCall('/api/v1/lenders/cra/report'),
  })
}

// Heatmap Hook
export const useHeatmap = (bounds?: {
  north: number
  south: number
  east: number
  west: number
}) => {
  const { user } = useAuth()
  const searchParams = new URLSearchParams()
  if (bounds) {
    searchParams.append('bounds', `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`)
  }

  return useQuery({
    queryKey: ['heatmap', bounds],
    queryFn: (): Promise<any> =>
      apiCall(`/api/v1/lenders/heatmap?${searchParams.toString()}`),
    enabled: !!bounds && !!user,
  })
}