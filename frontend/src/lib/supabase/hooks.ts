import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/supabase-auth-provider'

// Applicant hooks
export const useApplicants = () => {
  return useQuery({
    queryKey: ['applicants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })
}

export const useApplicant = (id: string) => {
  return useQuery({
    queryKey: ['applicant', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id
  })
}

export const useCreateApplicant = () => {
  const queryClient = useQueryClient()
  const { profile, user, refreshProfile } = useAuth()
  
  return useMutation({
    mutationFn: async (applicantData: any) => {
      console.log('useCreateApplicant - Initial profile check:', profile)
      
      // If profile is not loaded, try to refresh it
      let currentProfile = profile
      if (!currentProfile && user) {
        console.log('Profile not loaded, attempting to refresh...')
        await refreshProfile()
        // Get the updated profile from the profiles table directly
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('*, companies(*)')
          .eq('id', user.id)
          .single()
        
        if (freshProfile) {
          currentProfile = freshProfile
          console.log('Fresh profile loaded:', currentProfile)
        }
      }
      
      // Ensure we have a company_id - get or create default company
      let companyId = currentProfile?.company_id
      
      if (!companyId) {
        console.log('No company_id in profile, ensuring default company exists...')
        
        // Use the known default company ID
        companyId = 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8'
        
        // Verify the company exists
        const { data: companies, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('id', companyId)
          .single()
        
        if (companyError || !companies) {
          console.log('Default company not found, falling back to any available company...')
          // Fallback: get any company
          const { data: anyCompany } = await supabase
            .from('companies')
            .select('id')
            .limit(1)
            .single()
          
          if (anyCompany) {
            companyId = anyCompany.id
          } else {
            console.log('No companies found, creating default company...')
            const { data: newCompany, error: createError } = await supabase
              .from('companies')
              .insert({
                name: 'Default Company',
                key: 'default-company',
                plan: 'trial',
                seats: 100
              })
              .select()
              .single()
            
            if (createError) {
              console.error('Error creating company:', createError)
              throw new Error('Failed to create default company')
            }
            companyId = newCompany.id
          }
        }
        
        // If user exists but no profile, create or update the profile
        if (user) {
          console.log('Creating/updating user profile with company_id...')
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              company_id: companyId,
              role: user.user_metadata?.role || 'developer',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
            })
          
          if (profileError) {
            console.error('Error creating/updating profile:', profileError)
          }
        }
      }
      
      // Transform form data to match Supabase schema
      const transformedData = {
        company_id: companyId,
        full_name: `${applicantData.first_name || ''} ${applicantData.last_name || ''}`.trim(),
        email: applicantData.email,
        phone: applicantData.phone,
        income: applicantData.income,
        household_size: applicantData.household_size,
        preferences: {
          ami_percent: applicantData.ami_percent,
          location_preference: applicantData.location_preference,
          coordinates: applicantData.latitude && applicantData.longitude ? 
            [applicantData.latitude, applicantData.longitude] : null
        },
        status: 'active'
      }
      
      console.log('Creating applicant with transformed data:', transformedData)
      console.log('Current profile:', currentProfile)
      console.log('Company ID being used:', companyId)
      
      // First, let's check if the table exists by doing a simple select
      const { data: testData, error: testError } = await supabase
        .from('applicants')
        .select('count')
        .limit(1)
      
      console.log('Table existence check:', { testData, testError })
      
      // Log the exact data being sent
      console.log('Attempting insert with data:', JSON.stringify(transformedData, null, 2))
      
      const { data, error } = await supabase
        .from('applicants')
        .insert(transformedData)
        .select()
        .single()
      
      console.log('Insert result:', { data, error })
      
      // If error, let's check what's in the table
      if (error) {
        const { data: existingData, error: fetchError } = await supabase
          .from('applicants')
          .select('id, company_id, full_name')
          .limit(5)
        
        console.log('Existing applicants check:', { existingData, fetchError })
      }
      
      if (error) {
        console.error('Supabase insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Failed to create applicant: ${error.message}`)
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
    }
  })
}

export const useUpdateApplicant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { data, error } = await supabase
        .from('applicants')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
      queryClient.invalidateQueries({ queryKey: ['applicant', data.id] })
    }
  })
}

export const useDeleteApplicant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('applicants')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
    }
  })
}

// Project hooks
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, companies(name)')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })
}

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, companies(name)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  const { profile, user } = useAuth()
  
  return useMutation({
    mutationFn: async (projectData: any) => {
      // Ensure we have a company_id - get or create default company
      let companyId = profile?.company_id
      
      if (!companyId) {
        console.log('No company_id in profile, ensuring default company exists...')
        
        // Use the known default company ID
        companyId = 'fc81eaca-9f77-4265-b2b1-c5ff71ce43a8'
        
        // Verify the company exists
        const { data: companies, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('id', companyId)
          .single()
        
        if (companyError || !companies) {
          console.log('Default company not found, falling back to any available company...')
          // Fallback: get any company
          const { data: anyCompany } = await supabase
            .from('companies')
            .select('id')
            .limit(1)
            .single()
          
          if (anyCompany) {
            companyId = anyCompany.id
          } else {
            console.log('No companies found, creating default company...')
            const { data: newCompany, error: createError } = await supabase
              .from('companies')
              .insert({
                name: 'Default Company',
                key: 'default-company',
                plan: 'trial',
                seats: 100
              })
              .select()
              .single()
            
            if (createError) {
              console.error('Error creating company:', createError)
              throw new Error('Failed to create default company')
            }
            companyId = newCompany.id
          }
        }
        
        // If user exists but no profile, create the profile
        if (user && !profile) {
          console.log('Creating user profile...')
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              company_id: companyId,
              role: user.user_metadata?.role || 'developer',
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
            })
          
          if (profileError) {
            console.error('Error creating profile:', profileError)
            // Continue anyway, we have the company_id
          }
        }
      }
      
      // Transform form data to match Supabase schema
      const transformedData = {
        company_id: companyId,
        name: projectData.name,
        description: projectData.description,
        address: projectData.address,
        city: projectData.city || 'San Francisco',  // Default city
        state: projectData.state || 'CA',
        zip_code: projectData.zip_code || '',
        latitude: projectData.latitude || 37.7749,  // Default to SF coordinates
        longitude: projectData.longitude || -122.4194,
        total_units: parseInt(projectData.total_units) || 0,
        affordable_units: parseInt(projectData.affordable_units) || 0,
        ami_levels: projectData.ami_levels ? [projectData.ami_levels] : [],
        status: 'active'
      }
      
      console.log('Creating project with transformed data:', transformedData)
      console.log('User profile:', profile)
      console.log('Company ID being used:', profile?.company_id)
      
      // First, let's check if the table exists by doing a simple select
      const { data: testData, error: testError } = await supabase
        .from('projects')
        .select('count')
        .limit(1)
      
      console.log('Projects table existence check:', { testData, testError })
      
      const { data, error } = await supabase
        .from('projects')
        .insert(transformedData)
        .select()
        .single()
      
      console.log('Project insert result:', { data, error })
      
      if (error) {
        console.error('Supabase project insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Failed to create project: ${error.message}`)
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', data.id] })
    }
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

// User profile hooks
export const useCurrentUser = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['user', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })
}

export const useCurrentCompany = () => {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['company', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) throw new Error('No company ID')
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!profile?.company_id
  })
}

// Activities hook
export const useActivities = () => {
  return useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data
    }
  })
}

// Contact form hook
export const useSubmitContact = () => {
  return useMutation({
    mutationFn: async (contactData: any) => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .insert(contactData)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  })
}

// Matching hooks
export const useApplicantMatches = (applicantId: string) => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['applicant-matches', applicantId],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token')
      
      const response = await fetch(`http://localhost:8000/api/v1/applicants/${applicantId}/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch matches')
      return response.json()
    },
    enabled: !!applicantId && !!user
  })
}

export const useProjectMatches = (projectId: string) => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['project-matches', projectId],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token')
      
      const response = await fetch(`http://localhost:8000/api/v1/projects/${projectId}/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch project matches')
      return response.json()
    },
    enabled: !!projectId && !!user
  })
}

// Application hooks
export const useCreateApplication = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (applicationData: any) => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token')
      
      const response = await fetch('http://localhost:8000/api/v1/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      })
      
      if (!response.ok) throw new Error('Failed to create application')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    }
  })
}

export const useApplications = (filters?: any) => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['applications', filters],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token')
      
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.project_id) params.append('project_id', filters.project_id)
      if (filters?.applicant_id) params.append('applicant_id', filters.applicant_id)
      
      const response = await fetch(`http://localhost:8000/api/v1/applications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch applications')
      return response.json()
    },
    enabled: !!user
  })
}

export const useUpdateApplication = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ applicationId, updateData }: { applicationId: string, updateData: any }) => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token')
      
      const response = await fetch(`http://localhost:8000/api/v1/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) throw new Error('Failed to update application')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    }
  })
}

// Investment hooks
export const useCreateInvestment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (investmentData: any) => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token')
      
      const response = await fetch('http://localhost:8000/api/v1/investments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(investmentData)
      })
      
      if (!response.ok) throw new Error('Failed to create investment')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    }
  })
}

export const useInvestments = (filters?: any) => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['investments', filters],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token')
      
      const params = new URLSearchParams()
      if (filters?.project_id) params.append('project_id', filters.project_id)
      if (filters?.status) params.append('status', filters.status)
      
      const response = await fetch(`http://localhost:8000/api/v1/investments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch investments')
      return response.json()
    },
    enabled: !!user
  })
}

export const useLenderPortfolio = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token')
      
      const response = await fetch('http://localhost:8000/api/v1/lenders/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch portfolio')
      return response.json()
    },
    enabled: !!user && user.role === 'lender'
  })
}