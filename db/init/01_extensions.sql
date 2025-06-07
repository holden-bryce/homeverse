-- PostgreSQL Extensions and Initial Setup
-- This file is run when the PostgreSQL container starts for the first time

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Trigram matching for fuzzy search
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";  -- Query performance monitoring
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- Better indexing for complex queries

-- Create custom functions for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert audit record for any data changes
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            table_name, record_id, action, old_values, created_at
        ) VALUES (
            TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), CURRENT_TIMESTAMP
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            table_name, record_id, action, old_values, new_values, created_at
        ) VALUES (
            TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), CURRENT_TIMESTAMP
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            table_name, record_id, action, new_values, created_at
        ) VALUES (
            TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), CURRENT_TIMESTAMP
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Set timezone
SET timezone = 'UTC';

-- Performance settings
SHOW shared_preload_libraries;