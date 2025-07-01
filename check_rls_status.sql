-- Check current RLS status and policies

-- 1. Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('applications', 'profiles', 'companies', 'applicants', 'projects')
ORDER BY tablename;

-- 2. List all current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS "using_expression",
    with_check AS "with_check_expression"
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('applications', 'profiles', 'companies', 'applicants', 'projects')
ORDER BY tablename, policyname;

-- 3. Test if current user can read from applications
-- This will help debug permission issues
SELECT COUNT(*) as readable_applications FROM applications;

-- 4. Check current user info
SELECT 
    auth.uid() as user_id,
    auth.email() as user_email,
    auth.role() as user_role;