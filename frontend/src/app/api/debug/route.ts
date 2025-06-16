import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    // Try to create Supabase client
    const supabase = createClient()
    
    // Test auth
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    // Test database query
    let dbTest = { success: false, error: null as any }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .single()
      
      dbTest = { success: !error, error: error?.message }
    } catch (e: any) {
      dbTest = { success: false, error: e.message }
    }

    // Test if we can read cookies
    const cookieStore = cookies()
    const hasCookies = cookieStore.getAll().length > 0

    return NextResponse.json({
      status: 'debug',
      environment: process.env.NODE_ENV,
      checks: {
        env: envCheck,
        auth: {
          hasSession: !!session,
          error: authError?.message
        },
        database: dbTest,
        cookies: {
          accessible: hasCookies,
          count: cookieStore.getAll().length
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}