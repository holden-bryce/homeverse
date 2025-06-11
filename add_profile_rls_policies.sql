-- Add RLS policies for profiles table if missing

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Allow profile creation during signup
CREATE POLICY "Enable insert for authenticated users only" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Check what policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'profiles';