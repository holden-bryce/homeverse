-- Fix RLS policies for profiles table to ensure authenticated users can read their own profiles

-- First, check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- Create new, more permissive policies for profiles
-- 1. Allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- 2. Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 3. Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Allow service role full access (for backend operations)
CREATE POLICY "Service role has full access" ON public.profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Also check and fix companies table RLS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.companies;
DROP POLICY IF EXISTS "Companies are viewable by authenticated users" ON public.companies;

-- Allow all authenticated users to read companies
CREATE POLICY "Authenticated users can read companies" ON public.companies
    FOR SELECT
    TO authenticated
    USING (true);

-- Service role has full access to companies
CREATE POLICY "Service role has full access to companies" ON public.companies
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Check applicants table RLS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.applicants;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.applicants;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.applicants;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.applicants;

-- Applicants policies - users can only see/modify applicants from their company
CREATE POLICY "Users can view company applicants" ON public.applicants
    FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create company applicants" ON public.applicants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update company applicants" ON public.applicants
    FOR UPDATE
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete company applicants" ON public.applicants
    FOR DELETE
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Projects policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.projects;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.projects;

-- Projects are public to read
CREATE POLICY "Anyone can view projects" ON public.projects
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create company projects" ON public.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update company projects" ON public.projects
    FOR UPDATE
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Service role access for all tables
CREATE POLICY "Service role full access applicants" ON public.applicants
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access projects" ON public.projects
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Enable RLS on all tables if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;