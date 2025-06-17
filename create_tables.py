#!/usr/bin/env python3
"""
Script to create applications and investments tables in Supabase
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    print("❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# SQL to create applications table
applications_sql = """
-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    applicant_id uuid REFERENCES applicants(id) ON DELETE CASCADE,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),
    preferred_move_in_date date,
    additional_notes text,
    documents jsonb DEFAULT '[]'::jsonb,
    developer_notes text,
    reviewed_by uuid REFERENCES profiles(id),
    reviewed_at timestamptz,
    submitted_at timestamptz DEFAULT NOW(),
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);
"""

# SQL to create investments table
investments_sql = """
-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    lender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    amount decimal(12,2) NOT NULL,
    investment_type text DEFAULT 'equity' CHECK (investment_type IN ('equity', 'debt', 'grant')),
    expected_return decimal(5,2), -- Percentage
    actual_return decimal(5,2), -- Percentage
    term_months integer,
    status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'withdrawn')),
    notes text,
    invested_at timestamptz DEFAULT NOW(),
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);
"""

# SQL for indexes
indexes_sql = """
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_project_id ON applications(project_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_company_id ON applications(company_id);

CREATE INDEX IF NOT EXISTS idx_investments_project_id ON investments(project_id);
CREATE INDEX IF NOT EXISTS idx_investments_lender_id ON investments(lender_id);
CREATE INDEX IF NOT EXISTS idx_investments_company_id ON investments(company_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
"""

# SQL for updated_at triggers
triggers_sql = """
-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at 
    BEFORE UPDATE ON investments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
"""

def execute_sql(description, sql):
    """Execute SQL and handle errors"""
    try:
        print(f"🔄 {description}...")
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        print(f"✅ {description} completed successfully")
        return True
    except Exception as e:
        print(f"❌ {description} failed: {e}")
        return False

def main():
    print("🚀 Creating applications and investments tables...")
    
    # Try direct table creation using SQL RPC
    success = True
    
    # Create applications table
    success &= execute_sql("Creating applications table", applications_sql)
    
    # Create investments table  
    success &= execute_sql("Creating investments table", investments_sql)
    
    # Create indexes
    success &= execute_sql("Creating indexes", indexes_sql)
    
    # Create triggers
    success &= execute_sql("Creating triggers", triggers_sql)
    
    if success:
        print("\n🎉 All tables created successfully!")
        
        # Test the tables
        print("\n🔍 Testing table access...")
        try:
            apps_result = supabase.table('applications').select('count').limit(1).execute()
            print("✅ Applications table accessible")
        except Exception as e:
            print(f"⚠️  Applications table test failed: {e}")
            
        try:
            inv_result = supabase.table('investments').select('count').limit(1).execute()
            print("✅ Investments table accessible")
        except Exception as e:
            print(f"⚠️  Investments table test failed: {e}")
    else:
        print("\n❌ Some operations failed. Please check the errors above.")

if __name__ == "__main__":
    main()