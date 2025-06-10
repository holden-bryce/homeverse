-- Temporarily disable RLS on all tables to get the app working
-- IMPORTANT: This is for development only! Re-enable before production!

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE applicants DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (clean slate for later)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_company" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_delete" ON companies;

DROP POLICY IF EXISTS "applicants_select" ON applicants;
DROP POLICY IF EXISTS "applicants_insert" ON applicants;
DROP POLICY IF EXISTS "applicants_update" ON applicants;
DROP POLICY IF EXISTS "applicants_delete" ON applicants;

DROP POLICY IF EXISTS "projects_select_public" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;

DROP POLICY IF EXISTS "activities_select" ON activities;
DROP POLICY IF EXISTS "activities_insert" ON activities;

DROP POLICY IF EXISTS "contact_submissions_insert" ON contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_select" ON contact_submissions;

DROP POLICY IF EXISTS "matches_select" ON matches;
DROP POLICY IF EXISTS "matches_insert" ON matches;
DROP POLICY IF EXISTS "matches_update" ON matches;

-- Grant full access to authenticated users (temporary)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add a warning comment
COMMENT ON SCHEMA public IS 'WARNING: RLS is currently DISABLED. This is for development only. MUST re-enable before production launch!';