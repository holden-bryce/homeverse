-- HomeVerse Supabase Schema
-- Run this in Supabase SQL Editor after creating your project

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'trial',
    seats INTEGER DEFAULT 5,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    role TEXT NOT NULL CHECK (role IN ('developer', 'lender', 'buyer', 'applicant', 'admin')),
    full_name TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Applicants table
CREATE TABLE applicants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    income NUMERIC,
    household_size INTEGER,
    preferences JSONB DEFAULT '{}',
    documents JSONB DEFAULT '[]',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on applicants
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    total_units INTEGER,
    available_units INTEGER,
    ami_percentage INTEGER,
    amenities JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Contact submissions (public table)
CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table for AI matching
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    applicant_id UUID REFERENCES applicants(id),
    project_id UUID REFERENCES projects(id),
    score NUMERIC NOT NULL,
    factors JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE ON applicants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies

-- Companies: Users can only see their own company
CREATE POLICY "Users can view own company" ON companies
    FOR SELECT USING (id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Profiles: Users can view profiles in their company
CREATE POLICY "Users can view company profiles" ON profiles
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Applicants: Users can view applicants in their company
CREATE POLICY "Users can view company applicants" ON applicants
    FOR ALL USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Projects: Everyone can view projects (public)
CREATE POLICY "Projects are viewable by all" ON projects
    FOR SELECT USING (true);

-- Projects: Only company users can modify
CREATE POLICY "Users can modify company projects" ON projects
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update company projects" ON projects
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Activities: Users can view their company's activities
CREATE POLICY "Users can view company activities" ON activities
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Insert demo data
INSERT INTO companies (name, key) VALUES 
    ('Demo Company', 'demo-company-2024'),
    ('Sunset Developments', 'sunset-dev'),
    ('Urban Housing Partners', 'urban-housing');

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile entry when user signs up
    INSERT INTO profiles (id, role, full_name)
    VALUES (NEW.id, 'buyer', NEW.raw_user_meta_data->>'full_name');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('applicant-documents', 'applicant-documents', false),
    ('project-images', 'project-images', true);

-- Storage policies
CREATE POLICY "Users can upload applicant documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'applicant-documents' AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can view own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'applicant-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view project images" ON storage.objects
    FOR SELECT USING (bucket_id = 'project-images');