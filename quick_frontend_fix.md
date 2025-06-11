# Quick Frontend Fix - Profile Loading Issue

## Problem
- User authenticates successfully via Supabase
- Profile is null, causing loading state to persist
- Sidebar not populating because profile is required

## Root Cause
The profile query is failing because:
1. User exists in Supabase Auth
2. But no corresponding profile record in profiles table
3. RLS policies may be preventing profile creation/access

## Immediate Fix via Supabase Dashboard

1. **Go to Supabase Dashboard**
   - https://app.supabase.com/project/vzxadsifonqklotzhdpl

2. **Run this SQL in SQL Editor**:
```sql
-- Check if profile exists for admin user
SELECT * FROM profiles WHERE email = 'admin@test.com';

-- If no profile, create one
INSERT INTO profiles (id, email, full_name, role, company_id)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User'),
    COALESCE(au.raw_user_meta_data->>'role', 'admin'),
    (SELECT id FROM companies WHERE key = 'default-company' LIMIT 1)
FROM auth.users au
WHERE au.email = 'admin@test.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- Ensure default company exists
INSERT INTO companies (name, key, plan, seats)
VALUES ('Default Company', 'default-company', 'trial', 100)
ON CONFLICT (key) DO NOTHING;

-- Fix any profiles without company_id
UPDATE profiles 
SET company_id = (SELECT id FROM companies WHERE key = 'default-company' LIMIT 1)
WHERE company_id IS NULL;

-- Verify the fix
SELECT p.*, c.name as company_name 
FROM profiles p
JOIN companies c ON p.company_id = c.id
WHERE p.email = 'admin@test.com';
```

3. **Check RLS Policies**
   - Go to Authentication > Policies
   - Ensure profiles table has policy allowing users to read their own profile
   - If missing, add: `auth.uid() = id`

## Alternative: Direct Database Fix

If SQL Editor approach doesn't work, use Table Editor:
1. Go to Table Editor > profiles
2. Find the admin@test.com user
3. Ensure they have a company_id set
4. If not, update to use the default-company ID

## Verify Fix
After running the SQL:
1. Refresh the frontend page
2. Check browser console - profile should load
3. Sidebar should populate with menu items

## Long-term Solution
Wait for backend deployment to complete with Supabase backend, which handles profile creation automatically.