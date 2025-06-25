-- Create test users in Supabase
-- Run this in the SQL Editor after running supabase_schema.sql

-- First, ensure demo company exists
INSERT INTO companies (name, key) 
VALUES ('Demo Company', 'demo-company-2024')
ON CONFLICT (key) DO NOTHING;

-- Get the company ID
DO $$
DECLARE
    demo_company_id UUID;
BEGIN
    SELECT id INTO demo_company_id FROM companies WHERE key = 'demo-company-2024';
    
    -- NOTE: You need to create users through Supabase Auth dashboard first!
    -- Go to: https://vzxadsifonqklotzhdpl.supabase.co/project/vzxadsifonqklotzhdpl/auth/users
    -- Click "Add user" → "Create new user" for each:
    -- 
    -- developer@test.com / password123
    -- lender@test.com / password123  
    -- buyer@test.com / password123
    -- applicant@test.com / password123
    -- admin@test.com / password123
    --
    -- Make sure to check "Auto Confirm Email" for each user!
    
    RAISE NOTICE 'Demo company ID: %', demo_company_id;
    RAISE NOTICE 'Now go create the users in the Auth dashboard!';
END $$;

-- After creating users in Auth dashboard, come back and run this query
-- to see the user IDs and update their profiles:

-- View created users
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('developer@test.com', 'lender@test.com', 'buyer@test.com', 'applicant@test.com', 'admin@test.com');

-- Then manually update profiles with the user IDs from above
-- Example (replace the UUIDs with actual user IDs):
/*
UPDATE profiles SET 
    company_id = (SELECT id FROM companies WHERE key = 'demo-company-2024'),
    role = 'developer',
    full_name = 'Demo Developer'
WHERE id = 'USER_ID_HERE';
*/