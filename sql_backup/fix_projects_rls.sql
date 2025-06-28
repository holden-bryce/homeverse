-- Fix RLS policies for projects table
-- Run this in your Supabase SQL Editor

-- First, check existing policies
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
WHERE tablename = 'projects'
ORDER BY policyname;

-- Drop any restrictive policies that might be blocking
DROP POLICY IF EXISTS "Users can view projects from their company" ON projects;
DROP POLICY IF EXISTS "Developers can create projects" ON projects;
DROP POLICY IF EXISTS "Developers can update their projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for projects

-- 1. Allow authenticated users to view all projects (for browsing)
CREATE POLICY "Anyone can view projects" ON projects
    FOR SELECT 
    USING (true);

-- 2. Allow developers and admins to create projects
CREATE POLICY "Developers and admins can create projects" ON projects
    FOR INSERT 
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('developer', 'admin')
        )
    );

-- 3. Allow developers to update their own company's projects
CREATE POLICY "Developers can update company projects" ON projects
    FOR UPDATE 
    USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('developer', 'admin')
        )
    );

-- 4. Allow developers to delete their own company's projects  
CREATE POLICY "Developers can delete company projects" ON projects
    FOR DELETE 
    USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('developer', 'admin')
        )
    );

-- Verify the new policies
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
WHERE tablename = 'projects'
ORDER BY policyname;

-- Also check if the projects table exists and has the right columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;