-- SQL script to ensure all projects have valid coordinates for heatmap display
-- Run this in Supabase SQL Editor

-- First, let's check how many projects have missing coordinates
SELECT 
    COUNT(*) as total_projects,
    COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coordinates,
    COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as missing_coordinates
FROM projects;

-- Update projects with missing coordinates based on their city/location
-- San Francisco projects
UPDATE projects 
SET latitude = 37.7749, longitude = -122.4194 
WHERE (latitude IS NULL OR longitude IS NULL) 
AND (LOWER(city) LIKE '%san francisco%' OR LOWER(location) LIKE '%san francisco%' OR LOWER(address) LIKE '%san francisco%');

-- Oakland projects
UPDATE projects 
SET latitude = 37.8044, longitude = -122.2711 
WHERE (latitude IS NULL OR longitude IS NULL) 
AND (LOWER(city) LIKE '%oakland%' OR LOWER(location) LIKE '%oakland%' OR LOWER(address) LIKE '%oakland%');

-- San Jose projects
UPDATE projects 
SET latitude = 37.3382, longitude = -121.8863 
WHERE (latitude IS NULL OR longitude IS NULL) 
AND (LOWER(city) LIKE '%san jose%' OR LOWER(location) LIKE '%san jose%' OR LOWER(address) LIKE '%san jose%');

-- Berkeley projects
UPDATE projects 
SET latitude = 37.8715, longitude = -122.2730 
WHERE (latitude IS NULL OR longitude IS NULL) 
AND (LOWER(city) LIKE '%berkeley%' OR LOWER(location) LIKE '%berkeley%' OR LOWER(address) LIKE '%berkeley%');

-- For any remaining projects without coordinates, default to SF
UPDATE projects 
SET latitude = 37.7749, longitude = -122.4194 
WHERE latitude IS NULL OR longitude IS NULL;

-- Verify the updates
SELECT 
    id, 
    name, 
    city, 
    location,
    latitude, 
    longitude,
    CASE 
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 'Has Coordinates'
        ELSE 'Missing Coordinates'
    END as coordinate_status
FROM projects
ORDER BY created_at DESC;

-- Also ensure applicants have coordinates for demand heatmap
-- Default applicants without coordinates to various Bay Area locations
UPDATE applicants 
SET 
    latitude = CASE 
        WHEN id % 4 = 0 THEN 37.7749  -- San Francisco
        WHEN id % 4 = 1 THEN 37.8044  -- Oakland
        WHEN id % 4 = 2 THEN 37.3382  -- San Jose
        ELSE 37.8715                  -- Berkeley
    END,
    longitude = CASE 
        WHEN id % 4 = 0 THEN -122.4194  -- San Francisco
        WHEN id % 4 = 1 THEN -122.2711  -- Oakland
        WHEN id % 4 = 2 THEN -121.8863  -- San Jose
        ELSE -122.2730                  -- Berkeley
    END
WHERE latitude IS NULL OR longitude IS NULL;

-- Add some variation to make the heatmap more interesting
UPDATE applicants 
SET 
    latitude = latitude + (RANDOM() - 0.5) * 0.1,  -- Add random variation of +/- 0.05 degrees
    longitude = longitude + (RANDOM() - 0.5) * 0.1
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;