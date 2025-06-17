# Production Setup Instructions

## 1. Apply Schema Changes to Supabase

Go to your Supabase dashboard and run this SQL in the SQL Editor:

```sql
-- Ensure projects table has all required columns
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Ensure profiles table has company_id relationship
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to view images
CREATE POLICY "Public can view project images in storage" ON storage.objects
FOR SELECT USING (bucket_id = 'project-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload project images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'project-images' AND
    auth.role() = 'authenticated'
);
```

## 2. Create Production Projects

You can either:

### Option A: Use the Admin Dashboard
1. Login as developer@test.com
2. Navigate to Projects
3. Create new projects using the UI

### Option B: Direct Database Insert
Run this SQL in Supabase SQL Editor:

```sql
-- Insert sample projects with Bay Area locations
INSERT INTO projects (name, description, address, city, state, zip_code, latitude, longitude, total_units, affordable_units, status, company_id, ami_levels)
VALUES 
('Sunset Gardens', 'Affordable housing in Sunset District', '100 Sunset Blvd', 'San Francisco', 'CA', '94122', 37.7558, -122.4449, 120, 36, 'active', 'e48780e1-02e4-4162-9356-7a6e0e6508fa', ARRAY['30-50%', '50-80%']),
('Oakland Commons', 'Mixed-income community in Oakland', '500 Broadway', 'Oakland', 'CA', '94607', 37.8044, -122.2711, 200, 60, 'active', 'e48780e1-02e4-4162-9356-7a6e0e6508fa', ARRAY['30-60%', '60-80%']),
('Mission Bay Towers', 'New construction near UCSF', '1000 Mission Bay Blvd', 'San Francisco', 'CA', '94158', 37.7679, -122.3954, 300, 90, 'active', 'e48780e1-02e4-4162-9356-7a6e0e6508fa', ARRAY['50-80%', '80-100%']);
```

## 3. Verify the Setup

1. Check the heatmap at: https://homeverse-frontend.onrender.com/dashboard/lenders/analytics?tab=heatmap
2. Check the map view at: https://homeverse-frontend.onrender.com/dashboard/map
3. Try creating a project through the developer dashboard

## Notes

- The production database requires these fields for projects:
  - name (required)
  - address (required)
  - city (required)
  - state (default: 'CA')
  - zip_code
  - latitude (required for map display)
  - longitude (required for map display)
  - total_units (required)
  - affordable_units
  - status (default: 'planning')
  - company_id (required)

- The console errors about `events.mapbox.com` are Mapbox telemetry and can be ignored
- WebSocket errors are from Supabase Realtime and don't affect core functionality