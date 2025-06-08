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

export const useCRAReport = () => {
  return useMutation({
    mutationFn: (): Promise<any> => apiClient.get('/api/v1/lenders/cra/report'),
  })
}

export const useCRAAssessmentAreas = () => {
  return useQuery({
    queryKey: ['cra-assessment-areas'],
    queryFn: (): Promise<any> => apiClient.get('/api/v1/lenders/cra/assessment-areas'),
  })
}

export const useCreateCRAAssessmentArea = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any): Promise<any> =>
      apiClient.post('/api/v1/lenders/cra/assessment-areas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cra-assessment-areas'] })
      queryClient.invalidateQueries({ queryKey: ['cra-metrics'] })
    },
  })
}

// Document/File Upload Hooks
export const useUploadDocument = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: FormData): Promise<any> =>
      apiClient.post('/api/v1/documents/upload', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export const useDocuments = (params?: {
  entity_type?: string
  entity_id?: string
  document_category?: string
  skip?: number
  limit?: number
}) => {
  const searchParams = new URLSearchParams()
  if (params?.entity_type) searchParams.append('entity_type', params.entity_type)
  if (params?.entity_id) searchParams.append('entity_id', params.entity_id)
  if (params?.document_category) searchParams.append('document_category', params.document_category)
  if (params?.skip) searchParams.append('skip', params.skip.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())

  return useQuery({
    queryKey: ['documents', params],
    queryFn: (): Promise<any[]> =>
      apiClient.get(`/api/v1/documents?${searchParams.toString()}`),
  })
}

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: (documentId: string): Promise<Blob> =>
      apiClient.get(`/api/v1/documents/${documentId}/download`),
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (documentId: string): Promise<{ message: string }> =>
      apiClient.delete(`/api/v1/documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

// AMI and Eligibility Validation Hooks
export const useAMIByLocation = (location: string, household_size: number = 4, year: number = 2024) => {
  return useQuery({
    queryKey: ['ami', location, household_size, year],
    queryFn: (): Promise<any> => 
      apiClient.get(`/api/v1/ami/location/${location}?household_size=${household_size}&year=${year}`),
    enabled: !!location,
  })
}

export const useValidateEligibility = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { applicant_id: string; project_id: string }): Promise<any> =>
      apiClient.post('/api/v1/eligibility/validate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export const useIncomeAnalysis = () => {
  return useMutation({
    mutationFn: (data: { 
      annual_income: number; 
      household_size?: number; 
      location?: string 
    }): Promise<any> =>
      apiClient.post('/api/v1/eligibility/income-analysis', data),
  })
}

export const useEligibleProjects = (applicant_id: string, max_results: number = 10) => {
  return useQuery({
    queryKey: ['eligible-projects', applicant_id, max_results],
    queryFn: (): Promise<any> =>
      apiClient.get(`/api/v1/eligibility/projects/${applicant_id}?max_results=${max_results}`),
    enabled: !!applicant_id,
  })
}

// Notification System Hooks
export const useNotifications = (params?: {
  status?: string
  type?: string
  priority?: string
  skip?: number
  limit?: number
}) => {
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
    }> => apiClient.get(`/api/v1/notifications?${searchParams.toString()}`),
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (notificationId: string): Promise<{ message: string }> =>
      apiClient.post(`/api/v1/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (): Promise<{ message: string; updated_count: number }> =>
      apiClient.post('/api/v1/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: (): Promise<any> => apiClient.get('/api/v1/notifications/preferences'),
  })
}

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (preferences: {
      email_enabled: boolean
      sms_enabled: boolean
      push_enabled: boolean
      notification_types?: string[]
      email_frequency: string
      quiet_hours_start?: string
      quiet_hours_end?: string
    }): Promise<{ message: string }> =>
      apiClient.post('/api/v1/notifications/preferences', preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
    },
  })
}

export const useSendTestNotification = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (): Promise<{ message: string; notification_id: string }> =>
      apiClient.post('/api/v1/notifications/test'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
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

// Geospatial Search Hooks
export const useSearchProjects = (params: {
  lat: number
  lon: number
  radius_miles?: number
  min_units?: number
  max_units?: number
  ami_min?: number
  ami_max?: number
  status?: string
  limit?: number
}) => {
  const searchParams = new URLSearchParams()
  searchParams.append('lat', params.lat.toString())
  searchParams.append('lon', params.lon.toString())
  if (params.radius_miles) searchParams.append('radius_miles', params.radius_miles.toString())
  if (params.min_units) searchParams.append('min_units', params.min_units.toString())
  if (params.max_units) searchParams.append('max_units', params.max_units.toString())
  if (params.ami_min) searchParams.append('ami_min', params.ami_min.toString())
  if (params.ami_max) searchParams.append('ami_max', params.ami_max.toString())
  if (params.status) searchParams.append('status', params.status)
  if (params.limit) searchParams.append('limit', params.limit.toString())

  return useQuery({
    queryKey: ['search-projects', params],
    queryFn: (): Promise<{
      center: { lat: number; lon: number }
      radius_miles: number
      total_results: number
      projects: Project[]
    }> => apiClient.get(`/api/v1/search/projects?${searchParams.toString()}`),
    enabled: !!params.lat && !!params.lon,
  })
}

export const useSearchApplicants = (params: {
  project_id?: string
  lat?: number
  lon?: number
  radius_miles?: number
  income_min?: number
  income_max?: number
  household_size_min?: number
  household_size_max?: number
  limit?: number
}) => {
  const searchParams = new URLSearchParams()
  if (params.project_id) searchParams.append('project_id', params.project_id)
  if (params.lat) searchParams.append('lat', params.lat.toString())
  if (params.lon) searchParams.append('lon', params.lon.toString())
  if (params.radius_miles) searchParams.append('radius_miles', params.radius_miles.toString())
  if (params.income_min) searchParams.append('income_min', params.income_min.toString())
  if (params.income_max) searchParams.append('income_max', params.income_max.toString())
  if (params.household_size_min) searchParams.append('household_size_min', params.household_size_min.toString())
  if (params.household_size_max) searchParams.append('household_size_max', params.household_size_max.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())

  return useQuery({
    queryKey: ['search-applicants', params],
    queryFn: (): Promise<{
      center: { lat: number; lon: number }
      radius_miles: number
      total_results: number
      applicants: Applicant[]
    }> => apiClient.get(`/api/v1/search/applicants?${searchParams.toString()}`),
    enabled: !!params.project_id || (!!params.lat && !!params.lon),
  })
}

export const useSearchAmenities = () => {
  return useMutation({
    mutationFn: (data: {
      lat: number
      lon: number
      amenity_types?: string[]
      radius_miles?: number
    }): Promise<{
      location: { lat: number; lon: number }
      radius_miles: number
      amenities: Record<string, any[]>
      scores: {
        walkability: number
        transit: number
        overall_livability: number
      }
    }> => apiClient.post('/api/v1/search/amenities', data),
  })
}

