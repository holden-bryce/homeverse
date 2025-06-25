-- Fix Supabase Entity Creation Issues (Supabase Compatible Version)
-- This script ensures proper company assignment and entity creation

-- Step 1: Create or update the default company
INSERT INTO companies (name, key, plan, seats)
VALUES ('Default Company', 'default-company', 'trial', 100)
ON CONFLICT (key) DO NOTHING;

-- Step 2: Update the handle_new_user function to assign default company
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_company_id UUID;
    assigned_company_id UUID;
    user_role TEXT;
    user_full_name TEXT;
BEGIN
    -- Get default company ID
    SELECT id INTO default_company_id FROM companies WHERE key = 'default-company' LIMIT 1;
    
    -- Extract metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer');
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
    assigned_company_id := COALESCE((NEW.raw_user_meta_data->>'company_id')::UUID, default_company_id);
    
    -- Create profile with company assignment
    INSERT INTO profiles (id, company_id, role, full_name)
    VALUES (
        NEW.id, 
        assigned_company_id,
        user_role,
        user_full_name
    )
    ON CONFLICT (id) DO UPDATE SET
        company_id = COALESCE(profiles.company_id, EXCLUDED.company_id),
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create function to fix existing users without company_id
CREATE OR REPLACE FUNCTION fix_existing_profiles()
RETURNS void AS $$
DECLARE
    default_company_id UUID;
BEGIN
    -- Get default company ID
    SELECT id INTO default_company_id FROM companies WHERE key = 'default-company' LIMIT 1;
    
    -- Update profiles that don't have a company_id
    UPDATE profiles 
    SET company_id = default_company_id
    WHERE company_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute the fix for existing profiles
SELECT fix_existing_profiles();

-- Step 4: Create helper functions in public schema (not auth schema)
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 5: Update RLS policies to use helper functions
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own company" ON companies;
DROP POLICY IF EXISTS "Users can view company profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view company applicants" ON applicants;
DROP POLICY IF EXISTS "Users can create company applicants" ON applicants;
DROP POLICY IF EXISTS "Users can update company applicants" ON applicants;
DROP POLICY IF EXISTS "Users can delete company applicants" ON applicants;
DROP POLICY IF EXISTS "Users can modify company projects" ON projects;
DROP POLICY IF EXISTS "Users can update company projects" ON projects;
DROP POLICY IF EXISTS "Users can view company activities" ON activities;
DROP POLICY IF EXISTS "Users can create activities" ON activities;
DROP POLICY IF EXISTS "Users can view company matches" ON matches;
DROP POLICY IF EXISTS "Users can create matches" ON matches;
DROP POLICY IF EXISTS "Users can update matches" ON matches;
DROP POLICY IF EXISTS "Developers can create projects" ON projects;
DROP POLICY IF EXISTS "Developers can update projects" ON projects;
DROP POLICY IF EXISTS "Developers can delete projects" ON projects;

-- Recreate policies with helper functions
-- Companies
CREATE POLICY "Users can view own company" ON companies
    FOR SELECT USING (id = get_user_company_id());

-- Profiles
CREATE POLICY "Users can view company profiles" ON profiles
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Applicants
CREATE POLICY "Users can view company applicants" ON applicants
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can create company applicants" ON applicants
    FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update company applicants" ON applicants
    FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete company applicants" ON applicants
    FOR DELETE USING (company_id = get_user_company_id());

-- Projects
CREATE POLICY "Projects are viewable by all" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Developers can create projects" ON projects
    FOR INSERT WITH CHECK (
        company_id = get_user_company_id() AND 
        get_user_role() IN ('developer', 'admin')
    );

CREATE POLICY "Developers can update projects" ON projects
    FOR UPDATE USING (
        company_id = get_user_company_id() AND 
        get_user_role() IN ('developer', 'admin')
    );

CREATE POLICY "Developers can delete projects" ON projects
    FOR DELETE USING (
        company_id = get_user_company_id() AND 
        get_user_role() IN ('developer', 'admin')
    );

-- Activities
CREATE POLICY "Users can view company activities" ON activities
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can create activities" ON activities
    FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- Matches
CREATE POLICY "Users can view company matches" ON matches
    FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "Users can create matches" ON matches
    FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update matches" ON matches
    FOR UPDATE USING (company_id = get_user_company_id());

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_applicants_company_id ON applicants(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_matches_company_id ON matches(company_id);

-- Step 7: Add a check to ensure the trigger exists (Supabase might already have it)
DO $$
BEGIN
    -- Check if trigger exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created' 
        AND tgrelid = 'auth.users'::regclass
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    END IF;
END;
$$;

-- Step 8: Create a view to help debug profile issues
CREATE OR REPLACE VIEW profile_status AS
SELECT 
    p.id as profile_id,
    u.email,
    p.role,
    p.full_name,
    p.company_id,
    c.name as company_name,
    c.key as company_key,
    CASE 
        WHEN p.company_id IS NULL THEN 'Missing Company'
        ELSE 'Complete'
    END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN companies c ON p.company_id = c.id;

-- Grant access to the view
GRANT SELECT ON profile_status TO authenticated;