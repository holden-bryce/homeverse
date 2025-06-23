-- Update applicants table to use full_name instead of first_name/last_name
-- First, add the full_name column if it doesn't exist
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Migrate existing data by combining first_name and last_name
UPDATE applicants 
SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE full_name IS NULL;

-- Drop the old columns (optional - you might want to keep them for backward compatibility)
-- ALTER TABLE applicants DROP COLUMN IF EXISTS first_name;
-- ALTER TABLE applicants DROP COLUMN IF EXISTS last_name;

-- Make full_name required going forward
ALTER TABLE applicants ALTER COLUMN full_name SET NOT NULL;

-- Update the preferences structure if needed
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Migrate AMI and location data to preferences
UPDATE applicants 
SET preferences = jsonb_build_object(
    'ami_percent', ami_percent,
    'location_preference', location_preference,
    'coordinates', CASE 
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
        THEN jsonb_build_array(longitude, latitude)
        ELSE NULL
    END
)
WHERE preferences = '{}' OR preferences IS NULL;

-- Optional: Drop the old columns after migration
-- ALTER TABLE applicants DROP COLUMN IF EXISTS ami_percent;
-- ALTER TABLE applicants DROP COLUMN IF EXISTS location_preference;
-- ALTER TABLE applicants DROP COLUMN IF EXISTS latitude;
-- ALTER TABLE applicants DROP COLUMN IF EXISTS longitude;