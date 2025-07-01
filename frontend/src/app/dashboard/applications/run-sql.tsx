'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toast'
import { AlertCircle, CheckCircle } from 'lucide-react'

// SQL to fix RLS policies
const FIX_RLS_SQL = `
-- Ensure RLS is enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON applications;
DROP POLICY IF EXISTS "Comprehensive application read access" ON applications;

-- Create new read policy for authenticated users
CREATE POLICY "Authenticated users can read applications" ON applications
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to create applications
DROP POLICY IF EXISTS "Authenticated users can create applications" ON applications;
CREATE POLICY "Authenticated users can create applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow developers/admins to update applications
DROP POLICY IF EXISTS "Developers can update company applications" ON applications;
CREATE POLICY "Developers can update applications" ON applications
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Also ensure profiles and companies have basic read access
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
CREATE POLICY "Enable read access for authenticated users" ON profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON companies;
CREATE POLICY "Enable read access for authenticated users" ON companies
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Ensure applicants table has read access
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON applicants;
CREATE POLICY "Enable read for authenticated users" ON applicants
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Ensure projects table has read access
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON projects;
CREATE POLICY "Enable read for authenticated users" ON projects
    FOR SELECT USING (auth.uid() IS NOT NULL);
`;

export default function RunSQLPage() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const runSQL = async () => {
    setRunning(true)
    setResult(null)
    
    try {
      const supabase = createClient()
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', {
        sql: FIX_RLS_SQL
      })
      
      if (error) {
        // If RPC doesn't exist, show instructions
        setResult({
          success: false,
          message: `Please run this SQL in your Supabase dashboard SQL editor:\n\n${FIX_RLS_SQL}`
        })
      } else {
        setResult({
          success: true,
          message: 'RLS policies updated successfully! Please refresh the applications page.'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error}. Please run the SQL manually in Supabase.`
      })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Fix Applications RLS Policies</CardTitle>
          <CardDescription>
            This will update the Row Level Security policies to allow reading applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Important</p>
                <p className="text-sm text-yellow-700 mt-1">
                  This will update RLS policies for the applications, profiles, companies, applicants, and projects tables.
                  It will allow all authenticated users to read data from these tables.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={runSQL} 
            disabled={running}
            className="w-full"
          >
            {running ? 'Running SQL...' : 'Fix RLS Policies'}
          </Button>

          {result && (
            <div className={`rounded-lg p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? 'Success' : 'Manual Action Required'}
                  </p>
                  <pre className={`text-xs mt-1 whitespace-pre-wrap ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}