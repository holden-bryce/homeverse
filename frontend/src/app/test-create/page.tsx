import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

async function testCreate() {
  'use server'
  
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error(`Auth error: ${authError?.message || 'No user'}`)
    }
    
    // Try to create a test applicant
    const { data, error } = await supabase
      .from('applicants')
      .insert({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        household_size: 1,
        income: 50000,
        ami_percent: 80,
        latitude: 40.7128,
        longitude: -74.0060,
        company_id: 'test-company-id',
        user_id: user.id,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
    
    redirect('/dashboard/applicants')
  } catch (error: any) {
    console.error('Test create error:', error)
    throw error
  }
}

export default function TestCreatePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Create Applicant</h1>
      <p className="mb-4">This page tests the basic ability to create an applicant.</p>
      
      <form action={testCreate}>
        <Button type="submit">Test Create</Button>
      </form>
    </div>
  )
}