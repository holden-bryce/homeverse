-- Fix the projects table schema to match what the application expects
-- This adds all missing columns that the backend is trying to use

-- Add missing columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS location jsonb,
ADD COLUMN IF NOT EXISTS total_units integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_units integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS affordable_units integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ami_percentage integer DEFAULT 80,
ADD COLUMN IF NOT EXISTS min_income decimal(10,2),
ADD COLUMN IF NOT EXISTS max_income decimal(10,2),
ADD COLUMN IF NOT EXISTS min_rent decimal(10,2),
ADD COLUMN IF NOT EXISTS max_rent decimal(10,2),
ADD COLUMN IF NOT EXISTS amenities text[],
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS application_deadline date,
ADD COLUMN IF NOT EXISTS availability_date date,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW();

-- Add missing columns to applicants table for location tracking
ALTER TABLE applicants
ADD COLUMN IF NOT EXISTS desired_location jsonb,
ADD COLUMN IF NOT EXISTS current_address text,
ADD COLUMN IF NOT EXISTS move_in_date date;

-- Create project_images table for storing project images
CREATE TABLE IF NOT EXISTS project_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    caption text,
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT NOW()
);

-- Add RLS policies for project_images
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;

-- Allow public to view project images
CREATE POLICY "Public can view project images" ON project_images
    FOR SELECT USING (true);

-- Allow authenticated users from same company to manage project images
CREATE POLICY "Company users can manage project images" ON project_images
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE company_id = project_images.company_id
        )
    );

-- Create storage bucket for project images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to view images
CREATE POLICY "Public can view project images in storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'project-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload project images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'project-images' AND
        auth.role() = 'authenticated'
    );

-- Allow users to update their own uploaded images
CREATE POLICY "Users can update own project images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'project-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete own project images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'project-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_applicants_desired_location ON applicants USING GIN(desired_location);
CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images(project_id);