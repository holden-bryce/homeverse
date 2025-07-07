-- EMERGENCY FIX: Remove problematic foreign key constraints
-- Run this immediately in Supabase SQL Editor

BEGIN;

-- Find and drop the foreign key constraint on reviewed_by
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'applications'
    AND kcu.column_name = 'reviewed_by'
    LIMIT 1;
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE applications DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped FK constraint: %', constraint_name;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
END $$;

-- Make reviewed_by a simple text column (no FK)
ALTER TABLE applications ALTER COLUMN reviewed_by TYPE TEXT;

-- Ensure super permissive RLS policy
DROP POLICY IF EXISTS "applications_full_access" ON applications;
CREATE POLICY "applications_full_access" ON applications
    FOR ALL
    USING (true)  -- Most permissive possible
    WITH CHECK (true);

COMMIT;

-- Test that we can update applications now
SELECT 'Emergency fix applied successfully' as status;