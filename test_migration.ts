#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('🔐 Testing Authentication...')
  
  // Test login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@test.com',
    password: 'password123'
  })
  
  if (authError) {
    console.error('❌ Auth failed:', authError.message)
    return false
  }
  
  console.log('✅ Auth successful:', authData.user?.email)
  return true
}

async function testProfile() {
  console.log('\n👤 Testing Profile Access...')
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('❌ No authenticated user')
    return false
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('❌ Profile fetch failed:', error.message)
    return false
  }
  
  console.log('✅ Profile loaded:', {
    id: profile.id,
    role: profile.role,
    company: profile.company?.name
  })
  
  return profile
}

async function testApplicantsCRUD(companyId: string) {
  console.log('\n📝 Testing Applicants CRUD...')
  
  // Create
  const testApplicant = {
    first_name: 'Test',
    last_name: 'User',
    email: `test${Date.now()}@example.com`,
    phone: '555-0123',
    household_size: 3,
    income: 45000,
    ami_percent: 60,
    location_preference: 'Downtown',
    latitude: 40.7128,
    longitude: -74.0060,
    company_id: companyId,
    user_id: (await supabase.auth.getUser()).data.user?.id,
    status: 'pending'
  }
  
  const { data: created, error: createError } = await supabase
    .from('applicants')
    .insert([testApplicant])
    .select()
    .single()
  
  if (createError) {
    console.error('❌ Create failed:', createError.message)
    return false
  }
  
  console.log('✅ Created applicant:', created.id)
  
  // Read
  const { data: applicants, error: readError } = await supabase
    .from('applicants')
    .select('*')
    .eq('company_id', companyId)
  
  if (readError) {
    console.error('❌ Read failed:', readError.message)
    return false
  }
  
  console.log('✅ Read applicants:', applicants.length, 'found')
  
  // Update
  const { error: updateError } = await supabase
    .from('applicants')
    .update({ status: 'approved' })
    .eq('id', created.id)
  
  if (updateError) {
    console.error('❌ Update failed:', updateError.message)
    return false
  }
  
  console.log('✅ Updated applicant status')
  
  // Delete
  const { error: deleteError } = await supabase
    .from('applicants')
    .delete()
    .eq('id', created.id)
  
  if (deleteError) {
    console.error('❌ Delete failed:', deleteError.message)
    return false
  }
  
  console.log('✅ Deleted test applicant')
  
  return true
}

async function testRealtime(companyId: string) {
  console.log('\n📡 Testing Real-time Subscriptions...')
  
  return new Promise((resolve) => {
    const channel = supabase
      .channel('test-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'applicants',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          console.log('✅ Real-time event received:', payload.eventType)
          channel.unsubscribe()
          resolve(true)
        }
      )
      .subscribe()
    
    // Trigger an insert
    setTimeout(async () => {
      await supabase.from('applicants').insert({
        first_name: 'Realtime',
        last_name: 'Test',
        email: 'realtime@test.com',
        company_id: companyId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        household_size: 1,
        income: 50000,
        ami_percent: 80,
        latitude: 40.7128,
        longitude: -74.0060,
        status: 'pending'
      })
    }, 1000)
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.error('❌ Real-time timeout')
      channel.unsubscribe()
      resolve(false)
    }, 5000)
  })
}

async function runTests() {
  console.log('🚀 Starting Migration Tests...')
  console.log('================================\n')
  
  // Test authentication
  const authSuccess = await testAuth()
  if (!authSuccess) {
    console.log('\n❌ Authentication test failed. Exiting.')
    process.exit(1)
  }
  
  // Test profile
  const profile = await testProfile()
  if (!profile || !profile.company_id) {
    console.log('\n❌ Profile test failed. Exiting.')
    process.exit(1)
  }
  
  // Test CRUD operations
  const crudSuccess = await testApplicantsCRUD(profile.company_id)
  if (!crudSuccess) {
    console.log('\n❌ CRUD test failed.')
  }
  
  // Test real-time
  const realtimeSuccess = await testRealtime(profile.company_id)
  if (!realtimeSuccess) {
    console.log('\n❌ Real-time test failed.')
  }
  
  console.log('\n================================')
  console.log('✅ All tests completed!')
  
  // Sign out
  await supabase.auth.signOut()
}

// Run tests
runTests().catch(console.error)