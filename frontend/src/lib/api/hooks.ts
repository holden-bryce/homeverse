import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type {
  User,
  Company,
  Applicant,
  Project,
  Match,
  ReportRun,
  Investment,
  AuthResponse,
  LoginForm,
  RegisterForm,
  ApplicantForm,
  ProjectForm,
  InvestmentForm,
  PaginatedResponse,
} from '@/types'

// Auth Hooks
export const useLogin = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: LoginForm): Promise<AuthResponse> =>
      apiClient.login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      queryClient.invalidateQueries({ queryKey: ['current-company'] })
    },
  })
}

export const useRegister = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: RegisterForm): Promise<AuthResponse> =>
      apiClient.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      queryClient.invalidateQueries({ queryKey: ['current-company'] })
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: (): Promise<User> => apiClient.getCurrentUser(),
    enabled: typeof window !== 'undefined' && !!apiClient.getAuth().token,
  })
}

export const useCurrentCompany = () => {
  return useQuery({
    queryKey: ['current-company'],
    queryFn: (): Promise<Company> => apiClient.getCurrentCompany(),
    enabled: typeof window !== 'undefined' && !!apiClient.getAuth().token,
  })
}

// Applicant Hooks
export const useApplicants = (params?: {
  skip?: number
  limit?: number
  status?: string
  ami_band?: string
}) => {
  const searchParams = new URLSearchParams()
  if (params?.skip) searchParams.append('skip', params.skip.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.status) searchParams.append('status', params.status)
  if (params?.ami_band) searchParams.append('ami_band', params.ami_band)

  return useQuery({
    queryKey: ['applicants', params],
    queryFn: (): Promise<Applicant[]> =>
      apiClient.get(`/api/v1/applicants?${searchParams.toString()}`),
  })
}

export const useApplicant = (id: string) => {
  return useQuery({
    queryKey: ['applicant', id],
    queryFn: (): Promise<Applicant> => apiClient.get(`/api/v1/applicants/${id}`),
    enabled: !!id,
  })
}

export const useCreateApplicant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ApplicantForm): Promise<Applicant> =>
      apiClient.post('/api/v1/applicants', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
    },
  })
}

export const useUpdateApplicant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApplicantForm> }): Promise<Applicant> =>
      apiClient.put(`/api/v1/applicants/${id}`, data),
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
      apiClient.delete(`/api/v1/applicants/${id}`),
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
  const searchParams = new URLSearchParams()
  if (params?.skip) searchParams.append('skip', params.skip.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.status) searchParams.append('status', params.status)

  return useQuery({
    queryKey: ['projects', params],
    queryFn: (): Promise<Project[]> =>
      apiClient.get(`/api/v1/projects?${searchParams.toString()}`),
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
      apiClient.get(`/api/v1/projects/available?${searchParams.toString()}`),
  })
}

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: (): Promise<Project> => apiClient.get(`/api/v1/projects/${id}`),
    enabled: !!id,
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ProjectForm): Promise<Project> =>
      apiClient.post('/api/v1/projects', data),
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
      apiClient.put(`/api/v1/projects/${id}`, data),
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
      apiClient.delete(`/api/v1/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['available-projects'] })
    },
  })
}

// Matching Hooks
export const useRunMatching = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (applicantId: string): Promise<Match[]> =>
      apiClient.post('/api/v1/match', { applicant_id: applicantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}

export const useMatches = (applicantId?: string) => {
  return useQuery({
    queryKey: ['matches', applicantId],
    queryFn: (): Promise<Match[]> =>
      apiClient.get(`/api/v1/match/${applicantId}`),
    enabled: !!applicantId,
  })
}

// Report Hooks
export const useReports = (params?: {
  skip?: number
  limit?: number
  type?: string
}) => {
  const searchParams = new URLSearchParams()
  if (params?.skip) searchParams.append('skip', params.skip.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.type) searchParams.append('type', params.type)

  return useQuery({
    queryKey: ['reports', params],
    queryFn: (): Promise<ReportRun[]> =>
      apiClient.get(`/api/v1/reports?${searchParams.toString()}`),
  })
}

export const useCreateReport = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { report_type: string; parameters: Record<string, any> }): Promise<ReportRun> =>
      apiClient.post('/api/v1/reports', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export const useReport = (id: string) => {
  return useQuery({
    queryKey: ['report', id],
    queryFn: (): Promise<ReportRun> => apiClient.get(`/api/v1/reports/${id}`),
    enabled: !!id,
  })
}

export const useCRAMetrics = () => {
  return useQuery({
    queryKey: ['cra-metrics'],
    queryFn: (): Promise<any> => apiClient.get('/api/v1/lenders/cra/metrics'),
  })
}

// Heatmap Hooks
export const useHeatmap = (bounds?: {
  north: number
  south: number
  east: number
  west: number
}) => {
  const searchParams = new URLSearchParams()
  if (bounds) {
    searchParams.append('bounds', `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`)
  }

  return useQuery({
    queryKey: ['heatmap', bounds],
    queryFn: (): Promise<any> =>
      apiClient.get(`/api/v1/lenders/heatmap?${searchParams.toString()}`),
    enabled: !!bounds,
  })
}

// Investment Hooks
export const useInvestments = (params?: {
  skip?: number
  limit?: number
  status?: string
  risk_level?: string
}) => {
  const searchParams = new URLSearchParams()
  if (params?.skip) searchParams.append('skip', params.skip.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.status) searchParams.append('status', params.status)
  if (params?.risk_level) searchParams.append('risk_level', params.risk_level)

  return useQuery({
    queryKey: ['investments', params],
    queryFn: (): Promise<Investment[]> =>
      apiClient.get(`/api/v1/lenders/investments?${searchParams.toString()}`),
  })
}

export const useInvestment = (id: string) => {
  return useQuery({
    queryKey: ['investment', id],
    queryFn: (): Promise<Investment> => apiClient.get(`/api/v1/lenders/investments/${id}`),
    enabled: !!id,
  })
}

export const useCreateInvestment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: InvestmentForm): Promise<Investment> =>
      apiClient.post('/api/v1/lenders/investments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] })
    },
  })
}

export const useUpdateInvestment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvestmentForm> }): Promise<Investment> =>
      apiClient.put(`/api/v1/lenders/investments/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['investment', id] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] })
    },
  })
}

export const useDeleteInvestment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string): Promise<{ message: string }> =>
      apiClient.delete(`/api/v1/lenders/investments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-stats'] })
    },
  })
}

export const usePortfolioStats = () => {
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
    }> => apiClient.get('/api/v1/lenders/portfolio/stats'),
  })
}

export const useInvestmentPerformance = (timeframe?: '1M' | '3M' | '6M' | '1Y' | 'ALL') => {
  const searchParams = new URLSearchParams()
  if (timeframe) searchParams.append('timeframe', timeframe)

  return useQuery({
    queryKey: ['investment-performance', timeframe],
    queryFn: (): Promise<{
      roi: number
      invested: number
      current_value: number
      date: string
    }[]> => apiClient.get(`/api/v1/lenders/portfolio/performance?${searchParams.toString()}`),
  })
}

// Activity Hooks
export const useActivities = (params?: {
  type?: string
  limit?: number
  offset?: number
}) => {
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
    }[]> => apiClient.get(`/api/v1/activities?${searchParams.toString()}`),
  })
}

export const useActivityDetail = (id: string) => {
  return useQuery({
    queryKey: ['activity', id],
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
    }> => apiClient.get(`/api/v1/activities/${id}`),
    enabled: !!id,
  })
}

