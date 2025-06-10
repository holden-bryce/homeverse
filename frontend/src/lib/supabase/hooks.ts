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
  const { profile, user } = useAuth()
  
  return useMutation({
    mutationFn: async (applicantData: any) => {
      // Ensure we have a company_id - get or create default company
      let companyId = profile?.company_id
      
      if (!companyId) {
        console.log('No company_id in profile, ensuring default company exists...')
        
        // First, try to get or create the default company
        const { data: companies, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('key', 'demo-company-2024')
          .single()
        
        if (companyError || !companies) {
          console.log('Creating default company...')
          const { data: newCompany, error: createError } = await supabase
            .from('companies')
            .insert({
              name: 'Demo Company',
              key: 'demo-company-2024',
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
        } else {
          companyId = companies.id
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
      console.log('User profile:', profile)
      console.log('Company ID being used:', profile?.company_id)
      
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
        
        // First, try to get or create the default company
        const { data: companies, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('key', 'demo-company-2024')
          .single()
        
        if (companyError || !companies) {
          console.log('Creating default company...')
          const { data: newCompany, error: createError } = await supabase
            .from('companies')
            .insert({
              name: 'Demo Company',
              key: 'demo-company-2024',
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
        } else {
          companyId = companies.id
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
        location: projectData.location || projectData.address,
        total_units: projectData.total_units,
        available_units: projectData.affordable_units || projectData.total_units,
        ami_percentage: projectData.ami_levels ? parseInt(projectData.ami_levels) : null,
        amenities: [],
        images: [],
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