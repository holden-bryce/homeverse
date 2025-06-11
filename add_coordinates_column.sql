-- Add coordinates column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS coordinates FLOAT[] DEFAULT ARRAY[-122.4194, 37.7749]::FLOAT[];

-- Update existing projects with sample Bay Area coordinates
UPDATE projects 
SET coordinates = CASE 
    WHEN location LIKE '%San Francisco%' THEN ARRAY[-122.4194, 37.7749]::FLOAT[]
    WHEN location LIKE '%Oakland%' THEN ARRAY[-122.2711, 37.8044]::FLOAT[]
    WHEN location LIKE '%Berkeley%' THEN ARRAY[-122.2730, 37.8715]::FLOAT[]
    WHEN location LIKE '%San Jose%' THEN ARRAY[-121.8863, 37.3382]::FLOAT[]
    WHEN location LIKE '%Palo Alto%' THEN ARRAY[-122.1430, 37.4419]::FLOAT[]
    WHEN location LIKE '%Mountain View%' THEN ARRAY[-122.0840, 37.3861]::FLOAT[]
    ELSE ARRAY[-122.4194, 37.7749]::FLOAT[] -- Default to SF
END
WHERE coordinates IS NULL OR coordinates = ARRAY[-122.4194, 37.7749]::FLOAT[];

-- Add some variety to the coordinates for better map display
UPDATE projects
SET coordinates = CASE name
    WHEN 'Sunset Gardens' THEN ARRAY[-122.4946, 37.7599]::FLOAT[]
    WHEN 'Mission Bay Heights' THEN ARRAY[-122.3893, 37.7706]::FLOAT[]
    WHEN 'Richmond Village' THEN ARRAY[-122.4836, 37.7749]::FLOAT[]
    WHEN 'Lake Merritt Commons' THEN ARRAY[-122.2585, 37.8044]::FLOAT[]
    WHEN 'Riverside Commons' THEN ARRAY[-122.2585, 37.8044]::FLOAT[]
    WHEN 'Fruitvale Station Homes' THEN ARRAY[-122.2242, 37.7748]::FLOAT[]
    WHEN 'University Commons' THEN ARRAY[-122.2730, 37.8715]::FLOAT[]
    WHEN 'Silicon Valley Homes' THEN ARRAY[-121.8863, 37.3382]::FLOAT[]
    WHEN 'Willow Glen Residences' THEN ARRAY[-121.8996, 37.3069]::FLOAT[]
    ELSE coordinates
END;

-- Verify the update
SELECT name, location, coordinates FROM projects;