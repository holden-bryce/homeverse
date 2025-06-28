-- Comprehensive RLS Policy Fix for HomeVerse
-- This script fixes ALL table policies to work properly with server-side operations
-- Run this entire script in your Supabase SQL Editor

-- =========================================
-- 1. PROFILES TABLE
-- =========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Profiles are viewable by users in same company" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users" ON profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on id" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- =========================================
-- 2. COMPANIES TABLE
-- =========================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Companies are viewable by members" ON companies;
DROP POLICY IF EXISTS "Companies can be updated by admins" ON companies;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users" ON companies
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON companies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for company admins" ON companies
    FOR UPDATE USING (
        id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =========================================
-- 3. PROJECTS TABLE
-- =========================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Developers and admins can create projects" ON projects;
DROP POLICY IF EXISTS "Developers can update company projects" ON projects;
DROP POLICY IF EXISTS "Developers can delete company projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects from their company" ON projects;
DROP POLICY IF EXISTS "Developers can create projects" ON projects;

-- Create simple, permissive policies
CREATE POLICY "Enable read access for all users" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON projects
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON projects
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON projects
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- =========================================
-- 4. APPLICANTS TABLE
-- =========================================
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view applicants from their company" ON applicants;
DROP POLICY IF EXISTS "Users can create applicants for their company" ON applicants;
DROP POLICY IF EXISTS "Users can update applicants from their company" ON applicants;

-- Create new policies
CREATE POLICY "Enable read for authenticated users" ON applicants
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON applicants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON applicants
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON applicants
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- =========================================
-- 5. APPLICATIONS TABLE
-- =========================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Applicants can create applications" ON applications;
DROP POLICY IF EXISTS "Authenticated users can create applications" ON applications;
DROP POLICY IF EXISTS "Users can view relevant applications" ON applications;

-- Create new policies
CREATE POLICY "Enable read for authenticated users" ON applications
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON applications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON applications
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- =========================================
-- 6. INVESTMENTS TABLE
-- =========================================
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Lenders can create investments" ON investments;
DROP POLICY IF EXISTS "Authenticated lenders can create investments" ON investments;
DROP POLICY IF EXISTS "Users can view investments" ON investments;

-- Create new policies
CREATE POLICY "Enable read for authenticated users" ON investments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON investments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON investments
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- =========================================
-- 7. CONTACT_SUBMISSIONS TABLE
-- =========================================
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admins can view contact submissions" ON contact_submissions;

-- Create new policies
CREATE POLICY "Enable insert for all" ON contact_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON contact_submissions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- =========================================
-- 8. AUDIT_LOGS TABLE (if exists)
-- =========================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'audit_logs') THEN
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        
        -- Create policy
        CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON audit_logs
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
            
        CREATE POLICY IF NOT EXISTS "Enable read for authenticated users" ON audit_logs
            FOR SELECT USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- =========================================
-- IMPORTANT: Grant necessary permissions
-- =========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =========================================
-- Verify all policies were created
-- =========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =========================================
-- Check RLS is enabled on all tables
-- =========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;