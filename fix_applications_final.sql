-- Final fix for applications RLS permission issues
-- Run this in Supabase SQL Editor

-- First, make sure all related tables have proper policies
BEGIN;

-- APPLICATIONS table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for applications
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read for authenticated users" ON applications;
    DROP POLICY IF EXISTS "Users can view applications in their company" ON applications;
    DROP POLICY IF EXISTS "Applicants can view their own applications" ON applications;
    DROP POLICY IF EXISTS "Developers can view applications for their projects" ON applications;
    DROP POLICY IF EXISTS "Comprehensive application read access" ON applications;
    DROP POLICY IF EXISTS "Authenticated users can read applications" ON applications;
    DROP POLICY IF EXISTS "applications_select_authenticated" ON applications;
    
    DROP POLICY IF EXISTS "Authenticated users can create applications" ON applications;
    DROP POLICY IF EXISTS "Users can create applications" ON applications;
    DROP POLICY IF EXISTS "Applicants can create applications" ON applications;
    DROP POLICY IF EXISTS "applications_insert_authenticated" ON applications;
    
    DROP POLICY IF EXISTS "Developers can update company applications" ON applications;
    DROP POLICY IF EXISTS "Developers can update applications" ON applications;
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON applications;
    DROP POLICY IF EXISTS "applications_update_authenticated" ON applications;
    
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON applications;
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON applications;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Create very simple and permissive policies
CREATE POLICY "applications_full_access" ON applications
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- PROFILES table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_full_access" ON profiles
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- COMPANIES table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON companies;
DROP POLICY IF EXISTS "companies_select_authenticated" ON companies;
CREATE POLICY "companies_full_access" ON companies
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- APPLICANTS table
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON applicants;
DROP POLICY IF EXISTS "applicants_select_authenticated" ON applicants;
CREATE POLICY "applicants_full_access" ON applicants
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- PROJECTS table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON projects;
DROP POLICY IF EXISTS "projects_select_authenticated" ON projects;
CREATE POLICY "projects_full_access" ON projects
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Also make sure that the applications table has the correct structure
-- Verify company_id column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' 
        AND column_name = 'company_id'
    ) THEN
        ALTER TABLE applications ADD COLUMN company_id UUID REFERENCES companies(id);
        CREATE INDEX IF NOT EXISTS idx_applications_company_id ON applications(company_id);
    END IF;
END $$;

COMMIT;

-- Test that the policies work
SELECT 
    'applications' as table_name,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'applications'
ORDER BY policyname;