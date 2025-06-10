-- Fix Supabase Setup for HomeVerse
-- Run this in Supabase SQL Editor to ensure everything is properly configured

-- 1. First, check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- 2. Create demo company if it doesn't exist
INSERT INTO companies (name, key, plan, seats, settings)
VALUES ('Demo Company', 'demo-company-2024', 'trial', 100, '{}')
ON CONFLICT (key) DO UPDATE
SET name = EXCLUDED.name,
    plan = EXCLUDED.plan,
    seats = EXCLUDED.seats;

-- 3. Get the company ID
SELECT id, name, key FROM companies WHERE key = 'demo-company-2024';

-- 4. Check RLS status on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 5. TEMPORARILY disable RLS for testing (DO NOT USE IN PRODUCTION)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE applicants DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;

-- 6. Grant permissions to authenticated users
GRANT ALL ON companies TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON applicants TO authenticated;
GRANT ALL ON projects TO authenticated;
GRANT ALL ON activities TO authenticated;
GRANT ALL ON contact_submissions TO authenticated;
GRANT ALL ON matches TO authenticated;

-- 7. Create profiles for existing auth users (if any)
-- First, check existing auth users
SELECT id, email, raw_user_meta_data FROM auth.users;

-- 8. For each user that doesn't have a profile, create one
-- Replace USER_ID with actual IDs from above query
/*
INSERT INTO profiles (id, company_id, role, full_name)
SELECT 
    u.id,
    c.id as company_id,
    COALESCE(u.raw_user_meta_data->>'role', 'developer') as role,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name
FROM auth.users u
CROSS JOIN companies c
WHERE c.key = 'demo-company-2024'
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = u.id
);
*/

-- 9. Test insert into applicants table
-- Get company ID first, then run:
/*
INSERT INTO applicants (
    company_id, 
    full_name, 
    email, 
    phone, 
    income, 
    household_size, 
    preferences, 
    status
) VALUES (
    'YOUR_COMPANY_ID_HERE',  -- Replace with actual company ID
    'Test Applicant',
    'test@example.com',
    '555-1234',
    50000,
    3,
    '{"location": "San Francisco", "bedrooms": 2}',
    'active'
);
*/

-- 10. Check if insert worked
SELECT * FROM applicants ORDER BY created_at DESC LIMIT 5;

-- 11. Common fixes for insert issues:

-- Fix: Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix: Ensure proper default values
ALTER TABLE applicants ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE applicants ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE applicants ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE applicants ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE applicants ALTER COLUMN preferences SET DEFAULT '{}';
ALTER TABLE applicants ALTER COLUMN documents SET DEFAULT '[]';

-- Fix: Check constraints
SELECT conname, contype, conrelid::regclass 
FROM pg_constraint 
WHERE conrelid = 'applicants'::regclass;

-- 12. Debug: Show exact table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'applicants'
ORDER BY ordinal_position;

-- 13. Create a simple test function to verify inserts work
CREATE OR REPLACE FUNCTION test_applicant_insert()
RETURNS TABLE(success boolean, message text, applicant_id uuid) AS $$
DECLARE
    v_company_id uuid;
    v_applicant_id uuid;
BEGIN
    -- Get demo company ID
    SELECT id INTO v_company_id FROM companies WHERE key = 'demo-company-2024' LIMIT 1;
    
    IF v_company_id IS NULL THEN
        RETURN QUERY SELECT false, 'Demo company not found', NULL::uuid;
        RETURN;
    END IF;
    
    -- Try to insert
    BEGIN
        INSERT INTO applicants (company_id, full_name, email, status)
        VALUES (v_company_id, 'Function Test', 'function@test.com', 'active')
        RETURNING id INTO v_applicant_id;
        
        RETURN QUERY SELECT true, 'Insert successful', v_applicant_id;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT false, SQLERRM, NULL::uuid;
    END;
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT * FROM test_applicant_insert();

-- 14. If you see permission errors, run:
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;