-- Minimal Supabase Entity Creation Fix
-- Run this in Supabase SQL Editor

-- 1. Create default company
INSERT INTO companies (name, key, plan, seats)
VALUES ('Default Company', 'default-company', 'trial', 100)
ON CONFLICT (key) DO NOTHING;

-- 2. Fix existing profiles without company_id
DO $$
DECLARE
    default_company_id UUID;
    updated_count INTEGER;
BEGIN
    -- Get default company ID
    SELECT id INTO default_company_id FROM companies WHERE key = 'default-company' LIMIT 1;
    
    -- Update profiles that don't have a company_id
    UPDATE profiles 
    SET company_id = default_company_id
    WHERE company_id IS NULL;
    
    -- Get the number of updated rows
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Log the result
    RAISE NOTICE 'Updated % profiles with default company', updated_count;
END;
$$;

-- 3. Create a simple function to get current user's company
CREATE OR REPLACE FUNCTION current_user_company_id()
RETURNS UUID AS $$
DECLARE
    company_id UUID;
BEGIN
    SELECT p.company_id INTO company_id
    FROM profiles p
    WHERE p.id = auth.uid();
    
    RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Update the most critical RLS policies for entity creation

-- Applicants: Allow users to create/view/update within their company
DROP POLICY IF EXISTS "Users can view company applicants" ON applicants;
DROP POLICY IF EXISTS "Users can create company applicants" ON applicants;
DROP POLICY IF EXISTS "Users can update company applicants" ON applicants;

CREATE POLICY "Company users can manage applicants" ON applicants
    FOR ALL USING (
        company_id = current_user_company_id()
    );

-- Projects: Allow viewing by all, creation by developers/admins
DROP POLICY IF EXISTS "Projects are viewable by all" ON projects;
DROP POLICY IF EXISTS "Developers can create projects" ON projects;
DROP POLICY IF EXISTS "Developers can update projects" ON projects;

CREATE POLICY "Anyone can view projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Company developers can manage projects" ON projects
    FOR INSERT WITH CHECK (
        company_id = current_user_company_id() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('developer', 'admin')
        )
    );

CREATE POLICY "Company developers can update projects" ON projects
    FOR UPDATE USING (
        company_id = current_user_company_id() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('developer', 'admin')
        )
    );

-- 5. Create a debug function to check user status
CREATE OR REPLACE FUNCTION check_user_profile(user_email TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    has_profile BOOLEAN,
    profile_role TEXT,
    company_id UUID,
    company_name TEXT,
    can_create_applicants BOOLEAN,
    can_create_projects BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.email,
        p.id IS NOT NULL as has_profile,
        p.role as profile_role,
        p.company_id,
        c.name as company_name,
        p.company_id IS NOT NULL as can_create_applicants,
        (p.company_id IS NOT NULL AND p.role IN ('developer', 'admin')) as can_create_projects
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    LEFT JOIN companies c ON p.company_id = c.id
    WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage: SELECT * FROM check_user_profile('developer@test.com');