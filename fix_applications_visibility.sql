-- Fix Applications Visibility for Developers
-- This ensures developers can see applications for their projects

-- First, check if RLS is enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Enable read for authenticated users" ON applications;
DROP POLICY IF EXISTS "Users can view applications in their company" ON applications;
DROP POLICY IF EXISTS "Applicants can view their own applications" ON applications;
DROP POLICY IF EXISTS "Developers can view applications for their projects" ON applications;

-- Create a comprehensive read policy
-- This allows users to see applications if:
-- 1. They are in the same company as the application (for developers)
-- 2. They created the application (for applicants)
-- 3. They are an admin
CREATE POLICY "Comprehensive application read access" ON applications
    FOR SELECT USING (
        -- Developers/admins can see applications in their company
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
        OR
        -- Applicants can see their own applications
        applicant_id IN (
            SELECT id FROM applicants WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
        OR
        -- Admins can see all applications
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow authenticated users to create applications
CREATE POLICY "Authenticated users can create applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow developers/admins to update applications in their company
CREATE POLICY "Developers can update company applications" ON applications
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('developer', 'admin')
        )
    );

-- Also ensure profiles and companies tables have proper policies
-- Check profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Ensure basic read access for profiles
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
CREATE POLICY "Enable read access for authenticated users" ON profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Check companies RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Ensure basic read access for companies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON companies;
CREATE POLICY "Enable read access for authenticated users" ON companies
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Verify the current user's profile and company
-- Run this to debug:
/*
SELECT 
    p.id as profile_id,
    p.company_id,
    p.role,
    c.name as company_name,
    (SELECT COUNT(*) FROM applications WHERE company_id = p.company_id) as application_count
FROM profiles p
JOIN companies c ON c.id = p.company_id
WHERE p.id = auth.uid();
*/