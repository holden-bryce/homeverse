'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(email: string, password: string, fullName: string, role: string = 'buyer') {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      }
    }
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  if (data.user) {
    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      role: role,
      company_id: null // Will be set later
    })
    
    if (profileError) {
      throw new Error(profileError.message)
    }
  }
  
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}