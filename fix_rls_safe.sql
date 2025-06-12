-- Safe RLS Policies Fix for Production
-- This version checks for table existence before applying policies

-- Drop all existing policies first to avoid conflicts
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname 
               FROM pg_policies 
               WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Helper function to check if table exists
CREATE OR REPLACE FUNCTION table_exists(table_name text) 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on existing tables only
DO $$
BEGIN
    IF table_exists('profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('companies') THEN
        ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('applicants') THEN
        ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('projects') THEN
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('matches') THEN
        ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('notifications') THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Profiles policies (no recursion)
DO $$
BEGIN
    IF table_exists('profiles') THEN
        CREATE POLICY "Users can view own profile"
            ON profiles FOR SELECT
            USING (auth.uid() = id);

        CREATE POLICY "Users can update own profile"
            ON profiles FOR UPDATE
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);

        CREATE POLICY "Service role can manage all profiles"
            ON profiles FOR ALL
            USING (auth.jwt()->>'role' = 'service_role');
    END IF;
END $$;

-- Companies policies
DO $$
BEGIN
    IF table_exists('companies') AND table_exists('profiles') THEN
        CREATE POLICY "Users can view their company"
            ON companies FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.company_id = companies.id
                )
            );

        CREATE POLICY "Service role can manage all companies"
            ON companies FOR ALL
            USING (auth.jwt()->>'role' = 'service_role');
    END IF;
END $$;

-- Applicants policies
DO $$
BEGIN
    IF table_exists('applicants') AND table_exists('profiles') THEN
        CREATE POLICY "Users can view company applicants"
            ON applicants FOR SELECT
            USING (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                )
            );

        CREATE POLICY "Users can create company applicants"
            ON applicants FOR INSERT
            WITH CHECK (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                )
            );

        CREATE POLICY "Users can update company applicants"
            ON applicants FOR UPDATE
            USING (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                )
            )
            WITH CHECK (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                )
            );

        CREATE POLICY "Users can delete company applicants"
            ON applicants FOR DELETE
            USING (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                )
            );
    END IF;
END $$;

-- Projects policies
DO $$
BEGIN
    IF table_exists('projects') AND table_exists('profiles') THEN
        CREATE POLICY "Users can view company projects"
            ON projects FOR SELECT
            USING (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                )
            );

        CREATE POLICY "Users can create company projects"
            ON projects FOR INSERT
            WITH CHECK (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                )
            );

        CREATE POLICY "Users can update company projects"
            ON projects FOR UPDATE
            USING (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                )
            )
            WITH CHECK (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                )
            );

        CREATE POLICY "Users can delete company projects"
            ON projects FOR DELETE
            USING (
                company_id IN (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                )
            );
    END IF;
END $$;

-- Matches policies (only if all required tables exist)
DO $$
BEGIN
    IF table_exists('matches') AND table_exists('applicants') AND table_exists('projects') AND table_exists('profiles') THEN
        CREATE POLICY "Users can view company matches"
            ON matches FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM applicants
                    WHERE applicants.id = matches.applicant_id
                    AND applicants.company_id IN (
                        SELECT company_id FROM profiles WHERE id = auth.uid()
                    )
                )
                OR
                EXISTS (
                    SELECT 1 FROM projects
                    WHERE projects.id = matches.project_id
                    AND projects.company_id IN (
                        SELECT company_id FROM profiles WHERE id = auth.uid()
                    )
                )
            );
    END IF;
END $$;

-- Notifications policies (only if table exists)
DO $$
BEGIN
    IF table_exists('notifications') THEN
        CREATE POLICY "Users can view own notifications"
            ON notifications FOR SELECT
            USING (user_id = auth.uid());

        CREATE POLICY "Users can update own notifications"
            ON notifications FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Create indexes for performance (only on existing tables)
DO $$
BEGIN
    IF table_exists('profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
    END IF;
    
    IF table_exists('applicants') THEN
        CREATE INDEX IF NOT EXISTS idx_applicants_company_id ON applicants(company_id);
    END IF;
    
    IF table_exists('projects') THEN
        CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
    END IF;
    
    IF table_exists('matches') THEN
        CREATE INDEX IF NOT EXISTS idx_matches_applicant_id ON matches(applicant_id);
        CREATE INDEX IF NOT EXISTS idx_matches_project_id ON matches(project_id);
    END IF;
    
    IF table_exists('notifications') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Clean up helper function
DROP FUNCTION IF EXISTS table_exists(text);

-- Show what tables actually exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;