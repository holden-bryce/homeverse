-- Complete schema update for full functionality
-- Run this SQL in your Supabase SQL Editor

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    applicant_id uuid REFERENCES applicants(id) ON DELETE CASCADE,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),
    preferred_move_in_date date,
    additional_notes text,
    documents jsonb DEFAULT '[]'::jsonb,
    developer_notes text,
    reviewed_by uuid REFERENCES profiles(id),
    reviewed_at timestamptz,
    submitted_at timestamptz DEFAULT NOW(),
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    lender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    amount decimal(12,2) NOT NULL,
    investment_type text DEFAULT 'equity' CHECK (investment_type IN ('equity', 'debt', 'grant')),
    expected_return decimal(5,2), -- Percentage
    actual_return decimal(5,2), -- Percentage
    term_months integer,
    status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'withdrawn')),
    notes text,
    invested_at timestamptz DEFAULT NOW(),
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- Add RLS policies for applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Applicants can view their own applications
CREATE POLICY "Applicants can view own applications" ON applications
    FOR SELECT USING (
        applicant_id = auth.uid()
    );

-- Applicants can create applications
CREATE POLICY "Applicants can create applications" ON applications
    FOR INSERT WITH CHECK (
        applicant_id = auth.uid()
    );

-- Developers and admins can view applications for their company
CREATE POLICY "Company users can view applications" ON applications
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE company_id = applications.company_id 
            AND role IN ('developer', 'admin', 'lender')
        )
    );

-- Developers can update applications
CREATE POLICY "Developers can update applications" ON applications
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE company_id = applications.company_id 
            AND role IN ('developer', 'admin')
        )
    );

-- Add RLS policies for investments
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Lenders can view their own investments
CREATE POLICY "Lenders can view own investments" ON investments
    FOR SELECT USING (
        lender_id = auth.uid()
    );

-- Lenders can create investments
CREATE POLICY "Lenders can create investments" ON investments
    FOR INSERT WITH CHECK (
        lender_id = auth.uid()
    );

-- Developers can view investments in their projects
CREATE POLICY "Developers can view project investments" ON investments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE company_id = investments.company_id 
            AND role IN ('developer', 'admin')
        )
    );

-- Admins can view all investments
CREATE POLICY "Admins can view all investments" ON investments
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_project_id ON applications(project_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_company_id ON applications(company_id);

CREATE INDEX IF NOT EXISTS idx_investments_project_id ON investments(project_id);
CREATE INDEX IF NOT EXISTS idx_investments_lender_id ON investments(lender_id);
CREATE INDEX IF NOT EXISTS idx_investments_company_id ON investments(company_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at 
    BEFORE UPDATE ON investments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();