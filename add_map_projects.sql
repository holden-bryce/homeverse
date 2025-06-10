-- Add projects with proper coordinates for map display
-- Run this in Supabase SQL Editor

-- First, get the demo company ID
DO $$
DECLARE
    demo_company_id UUID;
BEGIN
    -- Get company ID
    SELECT id INTO demo_company_id FROM companies WHERE key = 'demo-company-2024' LIMIT 1;
    
    IF demo_company_id IS NULL THEN
        RAISE EXCEPTION 'Demo company not found. Please create it first.';
    END IF;

    -- Insert projects with real Bay Area coordinates
    -- Note: PostgreSQL uses ARRAY[lng, lat] format for coordinates
    
    -- San Francisco projects
    INSERT INTO projects (company_id, name, description, location, coordinates, total_units, available_units, ami_percentage, status) 
    VALUES 
    (demo_company_id, 'Sunset Gardens', 'Modern affordable housing in the Sunset District', 'San Francisco, CA', 
     ARRAY[-122.4946, 37.7599], 120, 45, 80, 'accepting_applications'),
    
    (demo_company_id, 'Mission Bay Heights', 'Waterfront community with transit access', 'San Francisco, CA', 
     ARRAY[-122.3893, 37.7706], 200, 75, 60, 'construction'),
    
    (demo_company_id, 'Richmond Village', 'Family-friendly homes near Golden Gate Park', 'San Francisco, CA', 
     ARRAY[-122.4836, 37.7749], 80, 20, 100, 'marketing')
    ON CONFLICT DO NOTHING;

    -- Oakland projects
    INSERT INTO projects (company_id, name, description, location, coordinates, total_units, available_units, ami_percentage, status) 
    VALUES 
    (demo_company_id, 'Lake Merritt Commons', 'Urban living with lake views', 'Oakland, CA', 
     ARRAY[-122.2585, 37.8044], 150, 60, 70, 'accepting_applications'),
    
    (demo_company_id, 'Fruitvale Station Homes', 'Transit-oriented affordable housing', 'Oakland, CA', 
     ARRAY[-122.2242, 37.7748], 180, 90, 50, 'construction')
    ON CONFLICT DO NOTHING;

    -- Berkeley project
    INSERT INTO projects (company_id, name, description, location, coordinates, total_units, available_units, ami_percentage, status) 
    VALUES 
    (demo_company_id, 'University Commons', 'Student and workforce housing near UC Berkeley', 'Berkeley, CA', 
     ARRAY[-122.2730, 37.8715], 100, 40, 80, 'planning')
    ON CONFLICT DO NOTHING;

    -- San Jose projects
    INSERT INTO projects (company_id, name, description, location, coordinates, total_units, available_units, ami_percentage, status) 
    VALUES 
    (demo_company_id, 'Silicon Valley Homes', 'Tech worker affordable housing', 'San Jose, CA', 
     ARRAY[-121.8863, 37.3382], 250, 100, 120, 'accepting_applications'),
    
    (demo_company_id, 'Willow Glen Residences', 'Community-focused development', 'San Jose, CA', 
     ARRAY[-121.8996, 37.3069], 90, 30, 90, 'marketing')
    ON CONFLICT DO NOTHING;

END $$;

-- Verify the projects were added
SELECT 
    name, 
    location, 
    coordinates,
    available_units,
    total_units,
    status,
    ami_percentage
FROM projects 
ORDER BY created_at DESC;

-- Update any projects that have NULL coordinates
UPDATE projects 
SET coordinates = CASE 
    WHEN location LIKE '%San Francisco%' THEN ARRAY[-122.4194, 37.7749]
    WHEN location LIKE '%Oakland%' THEN ARRAY[-122.2711, 37.8044]
    WHEN location LIKE '%Berkeley%' THEN ARRAY[-122.2730, 37.8715]
    WHEN location LIKE '%San Jose%' THEN ARRAY[-121.8863, 37.3382]
    ELSE ARRAY[-122.4194, 37.7749] -- Default to SF
END
WHERE coordinates IS NULL;