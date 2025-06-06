-- Initialize database with extensions and RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "h3";

-- Create RLS policies after tables are created
-- These will be applied by Alembic migrations

-- Function to get current company key from session
CREATE OR REPLACE FUNCTION get_current_company_key()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('request.company_key', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get company ID from company key
CREATE OR REPLACE FUNCTION get_company_id_from_key(company_key TEXT)
RETURNS UUID AS $$
DECLARE
    company_id UUID;
BEGIN
    SELECT id INTO company_id 
    FROM companies 
    WHERE key = company_key;
    RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for Supabase Realtime notifications
CREATE OR REPLACE FUNCTION notify_realtime(channel TEXT, payload JSONB)
RETURNS VOID AS $$
BEGIN
    -- This would integrate with Supabase Realtime
    -- For now, just a placeholder
    PERFORM pg_notify(channel, payload::text);
END;
$$ LANGUAGE plpgsql;