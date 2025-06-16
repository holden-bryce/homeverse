'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitContactForm(formData: FormData) {
  const supabase = createClient()
  
  const contactData = {
    name: `${formData.get('firstName')} ${formData.get('lastName')}`,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string || null,
    company: formData.get('company') as string || null,
    role: formData.get('role') as string || null,
    subject: formData.get('subject') as string || null,
    message: formData.get('message') as string,
    department: formData.get('department') as string || null,
    urgency: formData.get('urgency') as string || 'medium',
  }
  
  const { data, error } = await supabase
    .from('contact_submissions')
    .insert([contactData])
    .select()
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  // If SendGrid is configured, send email notification
  // This would be handled by a database trigger or edge function
  
  return { success: true, id: data.id }
}