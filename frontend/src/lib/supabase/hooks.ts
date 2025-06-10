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
  const { profile } = useAuth()
  
  return useMutation({
    mutationFn: async (applicantData: any) => {
      // Add company_id from current user profile
      const dataWithCompany = {
        ...applicantData,
        company_id: profile?.company_id || 'default-company'
      }
      
      console.log('Creating applicant with data:', dataWithCompany)
      
      const { data, error } = await supabase
        .from('applicants')
        .insert(dataWithCompany)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase insert error:', error)
        throw error
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
  const { profile } = useAuth()
  
  return useMutation({
    mutationFn: async (projectData: any) => {
      // Add company_id from current user profile
      const dataWithCompany = {
        ...projectData,
        company_id: profile?.company_id || 'default-company'
      }
      
      console.log('Creating project with data:', dataWithCompany)
      
      const { data, error } = await supabase
        .from('projects')
        .insert(dataWithCompany)
        .select()
        .single()
      
      if (error) {
        console.error('Supabase insert error:', error)
        throw error
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