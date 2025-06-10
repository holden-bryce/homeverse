-- Debug script to check Supabase auth issues

-- 1. Check if profiles exist for test users
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.company_id,
    c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.email IN ('admin@test.com', 'buyer@test.com', 'developer@test.com', 'lender@test.com', 'applicant@test.com');

-- 2. Check if auth.users exist
SELECT 
    id,
    email,
    raw_user_meta_data
FROM auth.users
WHERE email IN ('admin@test.com', 'buyer@test.com', 'developer@test.com', 'lender@test.com', 'applicant@test.com');

-- 3. Temporarily disable RLS to test (DO NOT USE IN PRODUCTION)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE applicants DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;

-- After testing, you can re-enable with:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- etc.