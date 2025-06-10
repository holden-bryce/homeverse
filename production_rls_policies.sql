-- Production-Ready RLS Policies for HomeVerse
-- These policies ensure secure multi-tenant data isolation without infinite recursion

-- ========================================
-- 1. Enable RLS on all tables
-- ========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. Drop existing policies (clean slate)
-- ========================================
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_delete" ON companies;

DROP POLICY IF EXISTS "applicants_select" ON applicants;
DROP POLICY IF EXISTS "applicants_insert" ON applicants;
DROP POLICY IF EXISTS "applicants_update" ON applicants;
DROP POLICY IF EXISTS "applicants_delete" ON applicants;

DROP POLICY IF EXISTS "projects_select" ON projects;
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

-- ========================================
-- 3. Create helper functions
-- ========================================

-- Function to get user's company_id without recursion
CREATE OR REPLACE FUNCTION auth.user_company_id() 
RETURNS UUID AS $$
  SELECT company_id 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to get user's role without recursion
CREATE OR REPLACE FUNCTION auth.user_role() 
RETURNS TEXT AS $$
  SELECT role 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========================================
-- 4. PROFILES table policies
-- ========================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can view profiles in their company
CREATE POLICY "profiles_select_company" ON profiles
  FOR SELECT USING (
    company_id = auth.user_company_id()
    AND auth.uid() != id  -- Prevent recursion by excluding self
  );

-- Users can only insert their own profile
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users cannot delete profiles
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (false);

-- ========================================
-- 5. COMPANIES table policies
-- ========================================

-- Users can view their own company
CREATE POLICY "companies_select" ON companies
  FOR SELECT USING (
    id = auth.user_company_id()
  );

-- Only admins can update company
CREATE POLICY "companies_update" ON companies
  FOR UPDATE USING (
    id = auth.user_company_id() 
    AND auth.user_role() = 'admin'
  );

-- Companies cannot be deleted via app
CREATE POLICY "companies_delete" ON companies
  FOR DELETE USING (false);

-- ========================================
-- 6. APPLICANTS table policies
-- ========================================

-- Users can view applicants in their company
CREATE POLICY "applicants_select" ON applicants
  FOR SELECT USING (
    company_id = auth.user_company_id()
  );

-- Users can create applicants for their company
CREATE POLICY "applicants_insert" ON applicants
  FOR INSERT WITH CHECK (
    company_id = auth.user_company_id()
  );

-- Users can update applicants in their company
CREATE POLICY "applicants_update" ON applicants
  FOR UPDATE USING (
    company_id = auth.user_company_id()
  );

-- Only admins can delete applicants
CREATE POLICY "applicants_delete" ON applicants
  FOR DELETE USING (
    company_id = auth.user_company_id()
    AND auth.user_role() = 'admin'
  );

-- ========================================
-- 7. PROJECTS table policies
-- ========================================

-- Everyone can view projects (public listing)
CREATE POLICY "projects_select_public" ON projects
  FOR SELECT USING (true);

-- Only developers and admins can create projects
CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (
    company_id = auth.user_company_id()
    AND auth.user_role() IN ('developer', 'admin')
  );

-- Only developers and admins can update their own projects
CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (
    company_id = auth.user_company_id()
    AND auth.user_role() IN ('developer', 'admin')
  );

-- Only admins can delete projects
CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (
    company_id = auth.user_company_id()
    AND auth.user_role() = 'admin'
  );

-- ========================================
-- 8. ACTIVITIES table policies
-- ========================================

-- Users can view activities in their company
CREATE POLICY "activities_select" ON activities
  FOR SELECT USING (
    company_id = auth.user_company_id()
  );

-- System creates activities (via trigger or service role)
CREATE POLICY "activities_insert" ON activities
  FOR INSERT WITH CHECK (
    company_id = auth.user_company_id()
    AND user_id = auth.uid()
  );

-- ========================================
-- 9. CONTACT_SUBMISSIONS table policies
-- ========================================

-- Anyone can submit contact forms
CREATE POLICY "contact_submissions_insert" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Only admins can view contact submissions
CREATE POLICY "contact_submissions_select" ON contact_submissions
  FOR SELECT USING (
    auth.user_role() = 'admin'
  );

-- ========================================
-- 10. MATCHES table policies
-- ========================================

-- Users can view matches for their company
CREATE POLICY "matches_select" ON matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applicants a
      WHERE a.id = matches.applicant_id
      AND a.company_id = auth.user_company_id()
    )
    OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = matches.project_id
      AND p.company_id = auth.user_company_id()
    )
  );

-- Only system can create matches
CREATE POLICY "matches_insert" ON matches
  FOR INSERT WITH CHECK (false);

-- Only system can update matches
CREATE POLICY "matches_update" ON matches
  FOR UPDATE USING (false);

-- ========================================
-- 11. Grant necessary permissions
-- ========================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION auth.user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_role() TO authenticated;

-- ========================================
-- 12. Create indexes for performance
-- ========================================

-- Index for faster company lookups
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_applicants_company_id ON applicants(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);

-- ========================================
-- 13. Test the policies
-- ========================================

-- Run these queries to test (replace with actual user ID):
-- SELECT auth.uid(); -- Get current user ID
-- SELECT auth.user_company_id(); -- Should return company ID
-- SELECT auth.user_role(); -- Should return role

-- ========================================
-- IMPORTANT NOTES:
-- ========================================
-- 1. These policies use SECURITY DEFINER functions to avoid recursion
-- 2. The functions cache the company_id and role for performance
-- 3. All policies respect multi-tenant isolation via company_id
-- 4. Public data (like projects) can be viewed by all
-- 5. Sensitive operations require specific roles (admin, developer)
-- 6. Contact forms are write-only for public, read-only for admins