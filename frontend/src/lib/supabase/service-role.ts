import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// This client bypasses RLS and should only be used in server-side code
// for admin operations like creating initial data, migrations, etc.
export function createServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Helper to ensure this is only used server-side
export function ensureServerOnly() {
  if (typeof window !== 'undefined') {
    throw new Error('Service role client can only be used on the server')
  }
}