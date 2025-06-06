// User and Auth Types
export interface User {
  id: string
  email: string
  role: string
  company_id: string
  is_active: boolean
  last_login?: string
  created_at: string
}

export interface Company {
  id: string
  key: string
  name: string
  plan: string
  seats: number
  settings: Record<string, any>
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

// Core Business Types
export interface Applicant {
  id: string
  company_id: string
  user_id: string
  geo_point: [number, number] // [lat, lng]
  ami_band: string
  household_size: number
  preferences: Record<string, any>
  status: string
  created_at: string
  updated_at?: string
}

export interface Project {
  id: string
  company_id: string
  name: string
  developer_name: string
  location: [number, number] // [lat, lng]
  unit_count: number
  ami_min: number
  ami_max: number
  est_delivery?: string
  metadata_json: Record<string, any>
  status: string
  created_at: string
  updated_at?: string
}

export interface Match {
  id: string
  company_id: string
  applicant_id: string
  project_id: string
  score: number
  status: string
  metadata: Record<string, any>
  created_at: string
}

export interface ReportRun {
  id: string
  company_id?: string
  user_id?: string
  report_type: string
  name: string
  parameters?: Record<string, any>
  status: string
  file_url?: string
  error_message?: string
  created_at: string
  completed_at?: string
  progress?: number
}

export interface Investment {
  id: string
  company_id: string
  project_id: string
  project_name: string
  developer: string
  location: string
  investment_amount: number
  date_invested: string
  current_value: number
  expected_roi: number
  current_performance: number
  roi: number
  status: 'active' | 'completed' | 'under_review' | 'at_risk'
  ami_compliance: number
  units_funded: number
  completion_date: string
  risk_level: 'low' | 'medium' | 'high'
  cra_qualified: boolean
  ami_target: string
  created_at: string
  updated_at?: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  company_key: string
  role?: string
}

export interface ApplicantForm {
  geo_point: [number, number]
  ami_band: string
  household_size: number
  preferences: Record<string, any>
}

export interface ProjectForm {
  name: string
  developer_name: string
  location: [number, number]
  unit_count: number
  ami_min: number
  ami_max: number
  est_delivery?: string
  metadata_json: Record<string, any>
}

export interface InvestmentForm {
  project_id: string
  investment_amount: number
  expected_roi: number
  units_funded: number
  completion_date: string
  risk_level: 'low' | 'medium' | 'high'
  ami_target: string
}

// UI Types
export interface TabItem {
  id: string
  label: string
  content: React.ReactNode
}

export interface NavItem {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
}

// Map Types
export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface HeatmapData {
  lat: number
  lng: number
  intensity: number
}

// Chart Types
export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

export interface TimeSeriesData {
  date: string
  value: number
  category?: string
}