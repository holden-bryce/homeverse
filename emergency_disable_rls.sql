-- EMERGENCY: Temporarily disable RLS to get the application working
-- WARNING: This removes all row-level security. Use only for testing!

-- Disable RLS on all relevant tables
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE applicants DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('applications', 'profiles', 'companies', 'applicants', 'projects')
ORDER BY tablename;

-- To re-enable RLS later, run:
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;