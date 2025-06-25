-- Emergency fix: Temporarily make profiles table accessible to authenticated users
-- This will allow the frontend to load profiles without timeout

-- First, drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- Create a simple policy that allows authenticated users to read ALL profiles
-- This is temporary to get the frontend working
CREATE POLICY "Authenticated users can read all profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can create own profile" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Service role gets full access
CREATE POLICY "Service role full access profiles" ON public.profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Also make sure companies table is readable
DROP POLICY IF EXISTS "Authenticated users can read companies" ON public.companies;
DROP POLICY IF EXISTS "Service role has full access to companies" ON public.companies;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.companies;
DROP POLICY IF EXISTS "Companies are viewable by authenticated users" ON public.companies;

CREATE POLICY "Anyone can read companies" ON public.companies
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role full access companies" ON public.companies
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Make sure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('profiles', 'companies')
ORDER BY tablename, policyname;