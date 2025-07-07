-- Fix the reviewed_by foreign key constraint issue
-- This removes the FK constraint that's causing RLS permission issues

BEGIN;

-- First, let's see the current structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'applications' 
AND column_name IN ('reviewed_by', 'reviewed_by_name');

-- Check if there's a foreign key constraint on reviewed_by
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'applications'
AND kcu.column_name = 'reviewed_by';

-- Drop the foreign key constraint if it exists
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the foreign key constraint name
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'applications'
    AND kcu.column_name = 'reviewed_by'
    LIMIT 1;
    
    -- Drop it if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE applications DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found on reviewed_by';
    END IF;
END $$;

-- Add a new text column for reviewer name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' 
        AND column_name = 'reviewed_by_name'
    ) THEN
        ALTER TABLE applications ADD COLUMN reviewed_by_name TEXT;
        RAISE NOTICE 'Added reviewed_by_name column';
    ELSE
        RAISE NOTICE 'reviewed_by_name column already exists';
    END IF;
END $$;

-- Ensure the applications table still has the basic columns needed
DO $$
BEGIN
    -- Make sure reviewed_by is just a text/uuid column without FK constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' 
        AND column_name = 'reviewed_by'
    ) THEN
        ALTER TABLE applications ADD COLUMN reviewed_by TEXT;
        RAISE NOTICE 'Added reviewed_by column as TEXT';
    END IF;
    
    -- Make sure reviewed_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' 
        AND column_name = 'reviewed_at'
    ) THEN
        ALTER TABLE applications ADD COLUMN reviewed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added reviewed_at column';
    END IF;
END $$;

-- Update any existing policies to be more permissive
DROP POLICY IF EXISTS "applications_full_access" ON applications;
CREATE POLICY "applications_full_access" ON applications
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;

-- Verify the final structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'applications' 
AND column_name IN ('reviewed_by', 'reviewed_by_name', 'reviewed_at')
ORDER BY column_name;