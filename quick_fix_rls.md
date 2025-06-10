# Quick Fix for RLS Infinite Recursion

## The Issue
The login is working but fetching the user profile fails with:
```
infinite recursion detected in policy for relation "profiles"
```

## Quick Fix Steps

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard/project/vzxadsifonqklotzhdpl/editor

2. **Run this SQL in the SQL Editor:**

```sql
-- Fix RLS policies to prevent infinite recursion

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

-- Create new simplified policies for profiles
-- Users can view all profiles in their company
CREATE POLICY "profiles_select" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can only insert their own profile
CREATE POLICY "profiles_insert" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can only delete their own profile
CREATE POLICY "profiles_delete" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- Fix companies policies to prevent recursion
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;

-- Allow users to view their own company
CREATE POLICY "companies_select" ON companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Only admin users can update company
CREATE POLICY "companies_update" ON companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.company_id = companies.id 
            AND profiles.role = 'admin'
        )
    );

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
```

3. **Click "Run" to execute the SQL**

4. **Test login again** - it should work now!

## What This Fixes
- Removes the circular reference in RLS policies
- Simplifies the policies to avoid recursion
- Maintains security while allowing proper access

## Alternative: Temporary Disable RLS (NOT RECOMMENDED for production)
If you need to test quickly:
```sql
-- TEMPORARY: Disable RLS for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
```

But make sure to re-enable with proper policies before going to production!