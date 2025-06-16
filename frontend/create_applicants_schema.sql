-- This SQL should be run in the Supabase SQL editor to update the applicants table

-- First, let's check current schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'applicants'
ORDER BY ordinal_position;

-- If columns are missing, add them:
ALTER TABLE applicants 
ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS email TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS household_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS income NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ami_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS location_preference TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC DEFAULT 40.7128,
ADD COLUMN IF NOT EXISTS longitude NUMERIC DEFAULT -74.0060,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enable RLS
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own applicants
CREATE POLICY "Users can create applicants" ON applicants
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to view their own applicants
CREATE POLICY "Users can view own applicants" ON applicants
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to update their own applicants  
CREATE POLICY "Users can update own applicants" ON applicants
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own applicants
CREATE POLICY "Users can delete own applicants" ON applicants
    FOR DELETE
    USING (auth.uid() = user_id);