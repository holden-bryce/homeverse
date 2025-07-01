-- Fix Applications Visibility for Developers (V2)
-- This version properly handles existing policies

-- First, check if RLS is enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for applications table to start fresh
DO $$ 
BEGIN
    -- Drop all SELECT policies
    DROP POLICY IF EXISTS "Enable read for authenticated users" ON applications;
    DROP POLICY IF EXISTS "Users can view applications in their company" ON applications;
    DROP POLICY IF EXISTS "Applicants can view their own applications" ON applications;
    DROP POLICY IF EXISTS "Developers can view applications for their projects" ON applications;
    DROP POLICY IF EXISTS "Comprehensive application read access" ON applications;
    DROP POLICY IF EXISTS "Authenticated users can read applications" ON applications;
    
    -- Drop all INSERT policies
    DROP POLICY IF EXISTS "Authenticated users can create applications" ON applications;
    DROP POLICY IF EXISTS "Users can create applications" ON applications;
    DROP POLICY IF EXISTS "Applicants can create applications" ON applications;
    
    -- Drop all UPDATE policies
    DROP POLICY IF EXISTS "Developers can update company applications" ON applications;
    DROP POLICY IF EXISTS "Developers can update applications" ON applications;
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON applications;
    DROP POLICY IF EXISTS "Enable update for users based on id" ON applications;
    
    -- Drop any other policies that might exist
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON applications;
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON applications;
END $$;

-- Now create fresh policies

-- Simple read policy for all authenticated users
-- This is the most permissive and should work for server-side queries
CREATE POLICY "applications_select_authenticated" ON applications
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to create applications
CREATE POLICY "applications_insert_authenticated" ON applications
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow updates for authenticated users (with company check at app level)
CREATE POLICY "applications_update_authenticated" ON applications
    FOR UPDATE 
    USING (auth.uid() IS NOT NULL);

-- Also ensure related tables have proper policies
-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_select_authenticated" ON profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- COMPANIES
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON companies;
DROP POLICY IF EXISTS "companies_select_authenticated" ON companies;
CREATE POLICY "companies_select_authenticated" ON companies
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- APPLICANTS
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON applicants;
DROP POLICY IF EXISTS "applicants_select_authenticated" ON applicants;
CREATE POLICY "applicants_select_authenticated" ON applicants
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- PROJECTS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON projects;
DROP POLICY IF EXISTS "projects_select_authenticated" ON projects;
CREATE POLICY "projects_select_authenticated" ON projects
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('applications', 'profiles', 'companies', 'applicants', 'projects')
ORDER BY tablename, policyname;