-- Fix map view by adding coordinates to projects table

-- 1. Add coordinates column if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS coordinates FLOAT[] DEFAULT ARRAY[-122.4194, 37.7749];

-- 2. Update existing projects with sample coordinates
UPDATE projects SET coordinates = CASE
  WHEN name LIKE '%Sunset%' THEN ARRAY[-122.4194, 37.7749]
  WHEN name LIKE '%Riverside%' THEN ARRAY[-122.2711, 37.8044]
  WHEN name LIKE '%Harbor%' THEN ARRAY[-121.8863, 37.3382]
  WHEN name LIKE '%Mission%' THEN ARRAY[-122.3893, 37.7706]
  WHEN name LIKE '%East%' THEN ARRAY[-122.2730, 37.8715]
  ELSE ARRAY[-122.4194 + (RANDOM() * 0.2 - 0.1), 37.7749 + (RANDOM() * 0.2 - 0.1)]
END
WHERE coordinates IS NULL OR coordinates = ARRAY[-122.4194, 37.7749];

-- 3. Create a simple test query to verify
SELECT 
  id,
  name, 
  location,
  coordinates,
  coordinates[1] as longitude,
  coordinates[2] as latitude
FROM projects
LIMIT 5;