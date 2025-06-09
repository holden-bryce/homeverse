-- Create test users in Supabase
-- Run this after the schema is set up

-- First, ensure we have the demo company
INSERT INTO companies (name, key) 
VALUES ('Demo Company', 'demo-company-2024')
ON CONFLICT (key) DO NOTHING;

-- Get the company ID
DO $$
DECLARE
    demo_company_id UUID;
BEGIN
    SELECT id INTO demo_company_id FROM companies WHERE key = 'demo-company-2024';
    
    -- Note: You'll need to create users through Supabase Auth dashboard or API
    -- Then run this to set up their profiles
    
    -- After creating users in Auth, update their profiles:
    -- Example (replace with actual user IDs after creating in Auth):
    /*
    INSERT INTO profiles (id, company_id, role, full_name) VALUES
        ('[DEVELOPER_USER_ID]', demo_company_id, 'developer', 'Demo Developer'),
        ('[LENDER_USER_ID]', demo_company_id, 'lender', 'Demo Lender'),
        ('[BUYER_USER_ID]', demo_company_id, 'buyer', 'Demo Buyer'),
        ('[APPLICANT_USER_ID]', demo_company_id, 'applicant', 'Demo Applicant'),
        ('[ADMIN_USER_ID]', demo_company_id, 'admin', 'Demo Admin');
    */
END $$;

-- Alternative: Use Supabase's admin API to create users programmatically
-- This requires using the service_role key from your backend

-- Sample data for testing
INSERT INTO projects (company_id, name, description, location, total_units, available_units, ami_percentage, amenities)
SELECT 
    id as company_id,
    'Sunset Gardens Phase 1' as name,
    'Modern affordable housing community with excellent amenities' as description,
    'Oakland, CA' as location,
    120 as total_units,
    45 as available_units,
    80 as ami_percentage,
    '["Playground", "Community Center", "Parking", "Laundry"]'::jsonb as amenities
FROM companies WHERE key = 'demo-company-2024';

INSERT INTO projects (company_id, name, description, location, total_units, available_units, ami_percentage, amenities)
SELECT 
    id as company_id,
    'Bayview Terrace' as name,
    'Sustainable housing with ocean views' as description,
    'San Francisco, CA' as location,
    80 as total_units,
    20 as available_units,
    60 as ami_percentage,
    '["Gym", "Rooftop Garden", "EV Charging", "Storage"]'::jsonb as amenities
FROM companies WHERE key = 'demo-company-2024';

-- Sample applicants
INSERT INTO applicants (company_id, full_name, email, phone, income, household_size, preferences)
SELECT 
    id as company_id,
    'John Smith' as full_name,
    'john.smith@example.com' as email,
    '555-1234' as phone,
    55000 as income,
    3 as household_size,
    '{"bedrooms": 2, "location": "Oakland", "max_rent": 1800}'::jsonb as preferences
FROM companies WHERE key = 'demo-company-2024';

INSERT INTO applicants (company_id, full_name, email, phone, income, household_size, preferences)
SELECT 
    id as company_id,
    'Maria Garcia' as full_name,
    'maria.garcia@example.com' as email,
    '555-5678' as phone,
    42000 as income,
    2 as household_size,
    '{"bedrooms": 1, "location": "San Francisco", "max_rent": 1500}'::jsonb as preferences
FROM companies WHERE key = 'demo-company-2024';