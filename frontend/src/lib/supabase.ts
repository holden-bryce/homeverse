import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a Supabase client configured to use cookies
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)

// Auth helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

export const signUp = async (email: string, password: string, metadata: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })
  
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Profile helpers
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Real-time subscriptions
export const subscribeToApplicants = (companyId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('applicants')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'applicants',
        filter: `company_id=eq.${companyId}`,
      },
      callback
    )
    .subscribe()
}

export const subscribeToProjects = (callback: (payload: any) => void) => {
  return supabase
    .channel('projects')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
      },
      callback
    )
    .subscribe()
}

// Storage helpers
export const uploadDocument = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('applicant-documents')
    .upload(path, file)
  
  if (error) throw error
  return data
}

export const getDocumentUrl = (path: string) => {
  const { data } = supabase.storage
    .from('applicant-documents')
    .getPublicUrl(path)
  
  return data.publicUrl
}