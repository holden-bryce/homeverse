-- Create missing tables for HomeVerse
-- Run this before applying RLS policies if needed

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create matches table if it doesn't exist
CREATE TABLE IF NOT EXISTS matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    score DECIMAL(3,2),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(applicant_id, project_id)
);

-- Add any missing columns to existing tables
DO $$
BEGIN
    -- Add company_id to profiles if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;
    
    -- Add company_id to applicants if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applicants' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE applicants ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;
    
    -- Add company_id to projects if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;
END $$;

-- Create test companies if they don't exist
INSERT INTO companies (id, name, key) 
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Test Company', 'test'),
    ('22222222-2222-2222-2222-222222222222', 'Demo Company', 'demo')
ON CONFLICT (key) DO NOTHING;

-- Show current table structure
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'companies', 'applicants', 'projects', 'matches', 'notifications')
GROUP BY table_name
ORDER BY table_name;