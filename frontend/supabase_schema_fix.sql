-- Fix for applicants table schema
-- Run this in Supabase SQL Editor

-- Drop existing empty table if needed
DROP TABLE IF EXISTS applicants CASCADE;

-- Create applicants table with proper schema
CREATE TABLE applicants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    household_size INTEGER DEFAULT 1,
    income NUMERIC DEFAULT 0,
    ami_percent NUMERIC DEFAULT 0,
    location_preference TEXT,
    latitude NUMERIC DEFAULT 40.7128,
    longitude NUMERIC DEFAULT -74.0060,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_applicants_company_id ON applicants(company_id);
CREATE INDEX idx_applicants_user_id ON applicants(user_id);
CREATE INDEX idx_applicants_status ON applicants(status);

-- Enable RLS
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow users to create applicants
CREATE POLICY "Users can create applicants" ON applicants
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Allow users to view applicants from their company
CREATE POLICY "Users can view company applicants" ON applicants
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Allow users to update their own applicants
CREATE POLICY "Users can update own applicants" ON applicants
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow users to delete their own applicants
CREATE POLICY "Users can delete own applicants" ON applicants
    FOR DELETE
    USING (auth.uid() = user_id);

-- Also fix projects table if needed
DROP TABLE IF EXISTS projects CASCADE;

CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    latitude NUMERIC DEFAULT 40.7128,
    longitude NUMERIC DEFAULT -74.0060,
    total_units INTEGER NOT NULL,
    affordable_units INTEGER NOT NULL,
    ami_levels JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'planning',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for projects
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Enable RLS for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can create projects" ON projects
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active projects" ON projects
    FOR SELECT
    USING (status = 'active' OR company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE ON applicants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();