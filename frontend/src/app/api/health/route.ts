import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Test database connection
    const { error } = await supabase
      .from('companies')
      .select('count')
      .limit(1)
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'homeverse-nextjs',
      database: 'connected'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'homeverse-nextjs',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}