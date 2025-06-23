-- Fix RLS policies for applications and investments tables
-- Run this in your Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Applicants can create applications" ON applications;
DROP POLICY IF EXISTS "Lenders can create investments" ON investments;

-- Create more permissive application creation policy
-- Allow any authenticated user to create applications (useful for testing and admin functions)
CREATE POLICY "Authenticated users can create applications" ON applications
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Alternative: More restrictive policy that allows applicants and developers to create applications
-- Uncomment this and comment the above if you prefer stricter security
/*
CREATE POLICY "Applicants and developers can create applications" ON applications
    FOR INSERT WITH CHECK (
        auth.uid() = applicant_id OR 
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('developer', 'admin')
        )
    );
*/

-- Create more permissive investment creation policy
CREATE POLICY "Authenticated lenders can create investments" ON investments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role IN ('lender', 'admin')
        )
    );

-- Verify policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('applications', 'investments')
ORDER BY tablename, policyname;
EOF < /dev/null
