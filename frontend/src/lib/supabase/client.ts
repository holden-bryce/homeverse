import { supabase } from '@/lib/supabase'

// Supabase API Client - provides a clean interface for data operations
export class SupabaseAPIClient {
  
  // Applicants
  async getApplicants() {
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async getApplicant(id: string) {
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  async createApplicant(applicantData: any) {
    const { data, error } = await supabase
      .from('applicants')
      .insert(applicantData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateApplicant(id: string, updates: any) {
    const { data, error } = await supabase
      .from('applicants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async deleteApplicant(id: string) {
    const { error } = await supabase
      .from('applicants')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Projects
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*, companies(name)')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async getProject(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*, companies(name)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  async createProject(projectData: any) {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateProject(id: string, updates: any) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // User and company data
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', user.id)
      .single()
    
    if (error) throw error
    return data
  }

  async getCurrentCompany() {
    const profile = await this.getCurrentUser()
    return profile.companies
  }

  // Activities
  async getActivities() {
    const { data, error } = await supabase
      .from('activities')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) throw error
    return data
  }

  // Contact form
  async submitContact(contactData: any) {
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert(contactData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // File uploads
  async uploadFile(file: File, bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    
    if (error) throw error
    return data
  }

  async getFileUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  }
}

// Export a singleton instance
export const supabaseAPI = new SupabaseAPIClient()