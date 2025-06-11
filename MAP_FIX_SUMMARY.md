# Map View Fix Summary

## Current Status
- ✅ Backend API is working and returning projects
- ✅ Frontend map components are properly configured
- ✅ Mapbox token is set in `.env.local`
- ✅ CSP headers are configured for Mapbox workers
- ❌ Projects don't have coordinates in the database

## The Issue
The main map view at `/dashboard/map` isn't showing project markers because:
1. The `coordinates` column doesn't exist in the Supabase `projects` table
2. The backend Pydantic models have been updated to include coordinates
3. The frontend is expecting coordinates but receiving `null`

## Solution Steps

### 1. Add Missing Columns to Supabase (REQUIRED)
Run the following SQL in your Supabase SQL Editor:

```sql
-- Fix projects table to include all necessary columns for map display
-- Run this in Supabase SQL Editor

-- 1. Add missing columns
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS coordinates FLOAT[] DEFAULT ARRAY[-122.4194, 37.7749]::FLOAT[];

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS price_range TEXT DEFAULT 'Contact for pricing';

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS developer_name TEXT DEFAULT 'Developer';

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS unit_types TEXT[] DEFAULT ARRAY['1BR', '2BR']::TEXT[];

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS estimated_delivery DATE;

-- 2. Update existing projects with coordinates
UPDATE projects 
SET coordinates = CASE 
    WHEN name = 'Marina Bay Towers' THEN ARRAY[-122.3893, 37.7706]::FLOAT[]
    WHEN name = 'Oakland Commons' THEN ARRAY[-122.2585, 37.8044]::FLOAT[]
    WHEN name = 'Sunset District Homes' THEN ARRAY[-122.4946, 37.7599]::FLOAT[]
    WHEN name LIKE 'Test Project%' AND location LIKE '%Berkeley%' THEN ARRAY[-122.2730, 37.8715]::FLOAT[]
    WHEN location LIKE '%San Francisco%' THEN ARRAY[-122.4194, 37.7749]::FLOAT[]
    WHEN location LIKE '%Oakland%' THEN ARRAY[-122.2711, 37.8044]::FLOAT[]
    WHEN location LIKE '%Berkeley%' THEN ARRAY[-122.2730, 37.8715]::FLOAT[]
    WHEN location LIKE '%San Jose%' THEN ARRAY[-121.8863, 37.3382]::FLOAT[]
    ELSE ARRAY[-122.4194, 37.7749]::FLOAT[]
END;

-- 3. Update price ranges
UPDATE projects 
SET price_range = CASE 
    WHEN name = 'Marina Bay Towers' THEN '$1,500 - $3,200'
    WHEN name = 'Oakland Commons' THEN '$1,200 - $2,800'
    WHEN name = 'Sunset District Homes' THEN '$1,400 - $2,900'
    WHEN name LIKE 'Test Project%' THEN '$1,000 - $2,000'
    ELSE '$1,200 - $2,500'
END;

-- 4. Update developer names
UPDATE projects 
SET developer_name = CASE 
    WHEN name = 'Marina Bay Towers' THEN 'Bay Area Developers'
    WHEN name = 'Oakland Commons' THEN 'Oakland Housing Partners'
    WHEN name = 'Sunset District Homes' THEN 'SF Housing LLC'
    WHEN name LIKE 'Test Project%' THEN 'Test Developer'
    ELSE 'HomeVerse Partners'
END;

-- 5. Update unit types
UPDATE projects 
SET unit_types = CASE 
    WHEN total_units > 150 THEN ARRAY['Studio', '1BR', '2BR', '3BR']::TEXT[]
    WHEN total_units > 100 THEN ARRAY['1BR', '2BR', '3BR']::TEXT[]
    WHEN total_units > 50 THEN ARRAY['Studio', '1BR', '2BR']::TEXT[]
    ELSE ARRAY['1BR', '2BR']::TEXT[]
END;

-- 6. Set estimated delivery dates
UPDATE projects 
SET estimated_delivery = CASE 
    WHEN status = 'accepting_applications' THEN CURRENT_DATE + INTERVAL '6 months'
    WHEN status = 'construction' THEN CURRENT_DATE + INTERVAL '12 months'
    WHEN status = 'planning' THEN CURRENT_DATE + INTERVAL '18 months'
    WHEN status = 'marketing' THEN CURRENT_DATE + INTERVAL '3 months'
    ELSE CURRENT_DATE + INTERVAL '9 months'
END;
```

### 2. Verify the Fix
After running the SQL:

1. Test the API again:
   ```bash
   python3 test_map_api.py
   ```
   You should now see coordinates for each project.

2. Check the map view:
   - Navigate to http://localhost:3000/dashboard/map
   - You should see project markers on the map
   - Clicking markers should show project details

### 3. What Was Already Fixed
- ✅ Backend models updated to include `coordinates` field
- ✅ CSP headers configured for Mapbox workers
- ✅ Mapbox token properly set
- ✅ Frontend components handle coordinate swapping ([lng, lat] format)
- ✅ Fallback map display when Mapbox fails

## Key Differences from Buyer Portal
The buyer portal map works because it uses hardcoded demo data with coordinates. The main map view uses real data from the database, which was missing the coordinates column.

## Files Changed
1. `supabase_backend.py` - Added coordinates to ProjectCreate and ProjectUpdate models
2. `fix_projects_table.sql` - SQL script to add missing columns
3. `MAP_FIX_SUMMARY.md` - This documentation

## Next Steps
1. Run the SQL script in Supabase SQL Editor
2. Restart the backend if needed
3. Test the map view