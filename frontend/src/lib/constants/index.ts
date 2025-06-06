export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const APP_NAME = 'HomeVerse'
export const APP_DESCRIPTION = 'Affordable Housing Platform for Lenders, Developers, and Buyers'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  LENDERS: '/dashboard/lenders',
  DEVELOPERS: '/dashboard/developers', 
  BUYERS: '/dashboard/buyers',
  APPLICANTS: '/dashboard/applicants',
  PROJECTS: '/dashboard/projects',
  ADMIN: '/dashboard/admin',
} as const

// AMI Bands with colors for visualization
export const AMI_BANDS = [
  { value: '30', label: '≤30% AMI', color: '#dc2626' },
  { value: '50', label: '31-50% AMI', color: '#ea580c' },
  { value: '60', label: '51-60% AMI', color: '#d97706' },
  { value: '80', label: '61-80% AMI', color: '#ca8a04' },
  { value: '100', label: '81-100% AMI', color: '#65a30d' },
  { value: '120', label: '101-120% AMI', color: '#059669' },
] as const

// Application Statuses
export const APPLICATION_STATUSES = [
  { value: 'draft', label: 'Draft', color: '#6b7280' },
  { value: 'submitted', label: 'Submitted', color: '#0d9488' },
  { value: 'under_review', label: 'Under Review', color: '#f59e0b' },
  { value: 'approved', label: 'Approved', color: '#10b981' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444' },
  { value: 'waitlisted', label: 'Waitlisted', color: '#8b5cf6' },
] as const

// Project Statuses
export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', color: '#6b7280' },
  { value: 'pre_development', label: 'Pre-Development', color: '#0d9488' },
  { value: 'under_construction', label: 'Under Construction', color: '#f59e0b' },
  { value: 'marketing', label: 'Marketing', color: '#8b5cf6' },
  { value: 'leasing', label: 'Leasing', color: '#10b981' },
  { value: 'completed', label: 'Completed', color: '#059669' },
] as const

// Match Statuses
export const MATCH_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#6b7280' },
  { value: 'contacted', label: 'Contacted', color: '#0d9488' },
  { value: 'interested', label: 'Interested', color: '#10b981' },
  { value: 'not_interested', label: 'Not Interested', color: '#ef4444' },
  { value: 'qualified', label: 'Qualified', color: '#059669' },
  { value: 'disqualified', label: 'Disqualified', color: '#dc2626' },
] as const

// User Roles
export const USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
  { value: 'viewer', label: 'Viewer' },
] as const

// Company Plans
export const COMPANY_PLANS = [
  { value: 'trial', label: 'Trial', maxSeats: 5 },
  { value: 'starter', label: 'Starter', maxSeats: 25 },
  { value: 'professional', label: 'Professional', maxSeats: 100 },
  { value: 'enterprise', label: 'Enterprise', maxSeats: 1000 },
] as const

// Navigation Items for each portal
export const LENDER_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/dashboard/lenders', icon: 'BarChart3' },
  { id: 'investments', label: 'Investments', href: '/dashboard/lenders/investments', icon: 'TrendingUp' },
  { id: 'compliance', label: 'CRA Compliance', href: '/dashboard/lenders/compliance', icon: 'Shield' },
  { id: 'market', label: 'Market Intelligence', href: '/dashboard/lenders/market', icon: 'Map' },
  { id: 'reports', label: 'Reports', href: '/dashboard/lenders/reports', icon: 'FileText' },
] as const

export const DEVELOPER_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', href: '/dashboard/developers', icon: 'BarChart3' },
  { id: 'projects', label: 'Projects', href: '/dashboard/projects', icon: 'Building' },
  { id: 'matching', label: 'Applicant Matching', href: '/dashboard/developers/matching', icon: 'Users' },
  { id: 'marketing', label: 'Marketing', href: '/dashboard/developers/marketing', icon: 'Megaphone' },
  { id: 'analytics', label: 'Analytics', href: '/dashboard/developers/analytics', icon: 'PieChart' },
] as const

export const BUYER_NAV_ITEMS = [
  { id: 'discover', label: 'Discover Projects', href: '/dashboard/buyers', icon: 'Search' },
  { id: 'applications', label: 'My Applications', href: '/dashboard/buyers/applications', icon: 'FileText' },
  { id: 'matches', label: 'Matches', href: '/dashboard/buyers/matches', icon: 'Heart' },
  { id: 'profile', label: 'Profile', href: '/dashboard/buyers/profile', icon: 'User' },
  { id: 'resources', label: 'Resources', href: '/dashboard/buyers/resources', icon: 'BookOpen' },
] as const

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [-74.006, 40.7128], // NYC
  DEFAULT_ZOOM: 11,
  MAPBOX_STYLE: 'mapbox://styles/mapbox/light-v11',
} as const

// Chart Colors
export const CHART_COLORS = [
  '#6b8e3a', // sage-500
  '#e6b83a', // cream-500
  '#0d9488', // teal-600
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
] as const

// Legacy constants for backward compatibility
export const PORTAL_TYPES = {
  LENDER: 'lender',
  DEVELOPER: 'developer',
  BUYER: 'buyer',
} as const

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  PLANNING: 'planning',
  CONSTRUCTION: 'construction',
  COMPLETED: 'completed',
  SOLD_OUT: 'sold_out',
} as const

export const APPLICANT_STATUS = {
  ACTIVE: 'active',
  MATCHED: 'matched',
  WAITLISTED: 'waitlisted',
  APPROVED: 'approved',
} as const