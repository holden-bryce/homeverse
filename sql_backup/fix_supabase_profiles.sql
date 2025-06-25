-- Fix Supabase Profiles for HomeVerse

-- 1. Create default company if it doesn't exist
INSERT INTO companies (name, key, plan, seats)
VALUES ('Default Company', 'default-company', 'trial', 100)
ON CONFLICT (key) DO NOTHING;

-- 2. Check what profiles exist
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.company_id,
    au.email,
    c.name as company_name
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
LEFT JOIN companies c ON p.company_id = c.id;

-- 3. Create profile for admin user if missing
INSERT INTO profiles (id, full_name, role, company_id)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User'),
    COALESCE(au.raw_user_meta_data->>'role', 'admin'),
    (SELECT id FROM companies WHERE key = 'default-company' LIMIT 1)
FROM auth.users au
WHERE au.email = 'admin@test.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- 4. Update existing profiles that have no company_id
UPDATE profiles 
SET company_id = (SELECT id FROM companies WHERE key = 'default-company' LIMIT 1)
WHERE company_id IS NULL;

-- 5. Create profiles for all test users
INSERT INTO profiles (id, full_name, role, company_id)
SELECT 
    au.id,
    CASE 
        WHEN au.email = 'developer@test.com' THEN 'Developer User'
        WHEN au.email = 'lender@test.com' THEN 'Lender User'
        WHEN au.email = 'buyer@test.com' THEN 'Buyer User'
        WHEN au.email = 'applicant@test.com' THEN 'Applicant User'
        WHEN au.email = 'admin@test.com' THEN 'Admin User'
        ELSE COALESCE(au.raw_user_meta_data->>'full_name', 'Test User')
    END,
    CASE 
        WHEN au.email = 'developer@test.com' THEN 'developer'
        WHEN au.email = 'lender@test.com' THEN 'lender'
        WHEN au.email = 'buyer@test.com' THEN 'buyer'
        WHEN au.email = 'applicant@test.com' THEN 'applicant'
        WHEN au.email = 'admin@test.com' THEN 'admin'
        ELSE COALESCE(au.raw_user_meta_data->>'role', 'buyer')
    END,
    (SELECT id FROM companies WHERE key = 'default-company' LIMIT 1)
FROM auth.users au
WHERE au.email IN (
    'developer@test.com',
    'lender@test.com',
    'buyer@test.com',
    'applicant@test.com',
    'admin@test.com'
)
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- 6. Verify the results
SELECT 
    p.*,
    au.email,
    c.name as company_name
FROM profiles p
JOIN auth.users au ON p.id = au.id
JOIN companies c ON p.company_id = c.id
WHERE au.email IN (
    'developer@test.com',
    'lender@test.com',
    'buyer@test.com',
    'applicant@test.com',
    'admin@test.com'
);

-- 7. Check RLS policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';