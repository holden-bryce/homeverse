-- Fix missing first_name/last_name for existing applicants
-- Run this in Supabase SQL Editor

-- First, check how many applicants have missing names
SELECT 
    COUNT(*) as total_applicants,
    COUNT(CASE WHEN first_name IS NULL OR first_name = '' THEN 1 END) as missing_first_name,
    COUNT(CASE WHEN last_name IS NULL OR last_name = '' THEN 1 END) as missing_last_name
FROM applicants;

-- Update applicants that have full_name but missing first_name/last_name
UPDATE applicants
SET 
    first_name = SPLIT_PART(TRIM(full_name), ' ', 1),
    last_name = TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
WHERE 
    full_name IS NOT NULL 
    AND full_name != ''
    AND (first_name IS NULL OR first_name = '');

-- For applicants with email but no name at all, use email prefix
UPDATE applicants
SET 
    first_name = SPLIT_PART(email, '@', 1),
    last_name = ''
WHERE 
    (first_name IS NULL OR first_name = '')
    AND email IS NOT NULL 
    AND email != '';

-- Set a default for any remaining null names
UPDATE applicants
SET 
    first_name = 'Unknown',
    last_name = 'Applicant'
WHERE 
    first_name IS NULL OR first_name = '';

-- Verify the fix
SELECT 
    id,
    first_name,
    last_name,
    full_name,
    email,
    CASE 
        WHEN first_name IS NOT NULL AND first_name != '' THEN 'Has Name'
        ELSE 'Missing Name'
    END as name_status
FROM applicants
ORDER BY created_at DESC
LIMIT 20;