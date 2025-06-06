import { z } from 'zod'
import { AMI_BANDS } from '@/lib/constants'

// Applicant Form Schema
export const applicantSchema = z.object({
  geo_point: z
    .tuple([z.number(), z.number()])
    .refine(
      ([lat, lng]) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180,
      'Invalid coordinates'
    ),
  ami_band: z.enum(AMI_BANDS.map(band => band.value) as [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid AMI band' }),
  }),
  household_size: z
    .number()
    .min(1, 'Household size must be at least 1')
    .max(10, 'Household size cannot exceed 10'),
  preferences: z.record(z.any()).default({}),
})

// Project Form Schema
export const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .min(3, 'Project name must be at least 3 characters')
    .max(255, 'Project name cannot exceed 255 characters'),
  developer_name: z
    .string()
    .min(1, 'Developer name is required')
    .min(2, 'Developer name must be at least 2 characters')
    .max(255, 'Developer name cannot exceed 255 characters'),
  location: z
    .tuple([z.number(), z.number()])
    .refine(
      ([lat, lng]) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180,
      'Invalid coordinates'
    ),
  unit_count: z
    .number()
    .min(1, 'Unit count must be at least 1')
    .max(10000, 'Unit count cannot exceed 10,000'),
  ami_min: z
    .number()
    .min(30, 'Minimum AMI must be at least 30%')
    .max(200, 'Minimum AMI cannot exceed 200%'),
  ami_max: z
    .number()
    .min(30, 'Maximum AMI must be at least 30%')
    .max(200, 'Maximum AMI cannot exceed 200%'),
  est_delivery: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{4}-\d{2}$/.test(val),
      'Estimated delivery must be in YYYY-MM format'
    ),
  metadata_json: z.record(z.any()).default({}),
}).refine((data) => data.ami_min <= data.ami_max, {
  message: 'Minimum AMI must be less than or equal to maximum AMI',
  path: ['ami_max'],
})

// Company Profile Schema
export const companyProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .min(2, 'Company name must be at least 2 characters')
    .max(255, 'Company name cannot exceed 255 characters'),
  plan: z.enum(['basic', 'professional', 'enterprise']),
  settings: z.record(z.any()).default({}),
})

// User Profile Schema
export const userProfileSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  role: z.enum(['admin', 'user', 'viewer']),
})

// Report Generation Schema
export const reportSchema = z.object({
  report_type: z.enum(['cra', 'market_analysis', 'portfolio_summary']),
  parameters: z.object({
    time_period_days: z
      .number()
      .min(1, 'Time period must be at least 1 day')
      .max(3650, 'Time period cannot exceed 10 years')
      .default(365),
    include_demographics: z.boolean().default(true),
    include_geographic_analysis: z.boolean().default(true),
    format: z.enum(['pdf', 'excel', 'csv']).default('pdf'),
  }),
})

// Search and Filter Schemas
export const applicantFilterSchema = z.object({
  status: z.enum(['active', 'matched', 'waitlisted', 'approved']).optional(),
  ami_band: z.enum(AMI_BANDS.map(band => band.value) as [string, ...string[]]).optional(),
  household_size: z.number().min(1).max(10).optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
})

export const projectFilterSchema = z.object({
  status: z.enum(['active', 'planning', 'construction', 'completed', 'sold_out']).optional(),
  ami_min: z.number().min(30).max(200).optional(),
  ami_max: z.number().min(30).max(200).optional(),
  min_units: z.number().min(1).optional(),
  max_units: z.number().min(1).optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
})

// Contact Form Schema
export const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  company: z
    .string()
    .min(1, 'Company is required')
    .min(2, 'Company name must be at least 2 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message cannot exceed 1000 characters'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-\(\)]+$/.test(val),
      'Please enter a valid phone number'
    ),
})

// Export types
export type ApplicantForm = z.infer<typeof applicantSchema>
export type ProjectForm = z.infer<typeof projectSchema>
export type CompanyProfileForm = z.infer<typeof companyProfileSchema>
export type UserProfileForm = z.infer<typeof userProfileSchema>
export type ReportForm = z.infer<typeof reportSchema>
export type ApplicantFilter = z.infer<typeof applicantFilterSchema>
export type ProjectFilter = z.infer<typeof projectFilterSchema>
export type ContactForm = z.infer<typeof contactSchema>