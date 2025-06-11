-- Check and Fix HomeVerse Profiles

-- 1. First, let's see what users and profiles we have
SELECT 
    au.id,
    au.email,
    au.created_at as user_created,
    p.id as profile_id,
    p.full_name,
    p.role,
    p.company_id,
    c.name as company_name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN companies c ON p.company_id = c.id
WHERE au.email IN (
    'admin@test.com',
    'developer@test.com',
    'lender@test.com',
    'buyer@test.com',
    'applicant@test.com'
)
ORDER BY au.email;

-- 2. Check if we have the default company
SELECT * FROM companies WHERE key = 'default-company';

-- 3. If you see users without profiles (profile_id is NULL), run this:
/*
INSERT INTO profiles (id, full_name, role, company_id)
SELECT 
    au.id,
    CASE 
        WHEN au.email = 'developer@test.com' THEN 'Developer User'
        WHEN au.email = 'lender@test.com' THEN 'Lender User'
        WHEN au.email = 'buyer@test.com' THEN 'Buyer User'
        WHEN au.email = 'applicant@test.com' THEN 'Applicant User'
        WHEN au.email = 'admin@test.com' THEN 'Admin User'
        ELSE 'Test User'
    END,
    CASE 
        WHEN au.email = 'developer@test.com' THEN 'developer'
        WHEN au.email = 'lender@test.com' THEN 'lender'
        WHEN au.email = 'buyer@test.com' THEN 'buyer'
        WHEN au.email = 'applicant@test.com' THEN 'applicant'
        WHEN au.email = 'admin@test.com' THEN 'admin'
        ELSE 'buyer'
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
*/

-- 4. Check existing RLS policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 5. Test if current user can read profiles
SELECT current_setting('request.jwt.claims', true)::json->>'sub' as current_user_id;

-- 6. Try to read your own profile (replace the ID with the one from step 1)
-- SELECT * FROM profiles WHERE id = 'YOUR-USER-ID-HERE';