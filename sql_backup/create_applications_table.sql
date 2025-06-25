-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),
    preferred_move_in_date DATE,
    additional_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id),
    developer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, applicant_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_applications_project_id ON applications(project_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at DESC);

-- Add RLS policies
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy for users to view applications in their company
CREATE POLICY "Users can view applications in their company" ON applications
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy for users to create applications
CREATE POLICY "Users can create applications" ON applications
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy for developers/admins to update applications
CREATE POLICY "Developers can update applications" ON applications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND company_id = applications.company_id
            AND role IN ('developer', 'admin')
        )
    );

-- Policy for applicants to withdraw their own applications
CREATE POLICY "Applicants can withdraw their applications" ON applications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM applicants 
            WHERE id = applications.applicant_id 
            AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for applications with related data
CREATE OR REPLACE VIEW applications_with_details AS
SELECT 
    a.*,
    p.name as project_name,
    p.address as project_address,
    p.city as project_city,
    p.state as project_state,
    TRIM(CONCAT(COALESCE(ap.first_name, ''), ' ', COALESCE(ap.last_name, ''))) as applicant_name,
    ap.email as applicant_email,
    ap.phone as applicant_phone,
    rp.full_name as reviewer_name
FROM applications a
LEFT JOIN projects p ON a.project_id = p.id
LEFT JOIN applicants ap ON a.applicant_id = ap.id
LEFT JOIN profiles rp ON a.reviewed_by = rp.id;

-- Grant permissions on the view
GRANT SELECT ON applications_with_details TO authenticated;