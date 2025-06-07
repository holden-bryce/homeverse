-- PostgreSQL Enhanced Schema for HomeVerse
-- Optimized for production use with advanced features

-- Companies table with enhanced features
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'trial',
    max_seats INTEGER DEFAULT 5,
    settings JSONB DEFAULT '{}',
    billing_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Add search capabilities
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || company_key)
    ) STORED,
    
    CONSTRAINT valid_plan CHECK (plan IN ('trial', 'basic', 'professional', 'enterprise')),
    CONSTRAINT positive_max_seats CHECK (max_seats > 0)
);

-- Users table with enhanced security
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Row Level Security
    CONSTRAINT valid_role CHECK (role IN ('admin', 'lender', 'developer', 'buyer', 'applicant')),
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT positive_failed_attempts CHECK (failed_login_attempts >= 0)
);

-- Projects table with geospatial support
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    developer VARCHAR(255),
    location VARCHAR(255),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    total_units INTEGER,
    affordable_units INTEGER,
    ami_levels TEXT[],
    unit_types TEXT[],
    status VARCHAR(50) DEFAULT 'planning',
    completion_date DATE,
    application_deadline DATE,
    description TEXT,
    amenities JSONB DEFAULT '[]',
    images TEXT[],
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    contact_info JSONB DEFAULT '{}',
    lottery_date DATE,
    lottery_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Full text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(name, '') || ' ' || 
            COALESCE(location, '') || ' ' || 
            COALESCE(description, '') || ' ' ||
            COALESCE(developer, '')
        )
    ) STORED,
    
    CONSTRAINT valid_status CHECK (status IN ('planning', 'construction', 'marketing', 'accepting_applications', 'lottery', 'completed', 'cancelled')),
    CONSTRAINT positive_units CHECK (total_units > 0),
    CONSTRAINT affordable_units_check CHECK (affordable_units <= total_units),
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    ),
    CONSTRAINT valid_price_range CHECK (
        price_range_min IS NULL OR price_range_max IS NULL OR 
        price_range_min <= price_range_max
    )
);

-- Applicants table with enhanced data
CREATE TABLE applicants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    household_size INTEGER,
    annual_income DECIMAL(12,2),
    employment_status VARCHAR(50),
    employer_name VARCHAR(255),
    current_address TEXT,
    previous_address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    preferred_locations TEXT[],
    unit_preferences JSONB DEFAULT '{}',
    accessibility_needs JSONB DEFAULT '{}',
    documents JSONB DEFAULT '[]',
    background_check_status VARCHAR(50) DEFAULT 'pending',
    credit_score INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Search capabilities
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            first_name || ' ' || last_name || ' ' || email ||
            COALESCE(' ' || employer_name, '')
        )
    ) STORED,
    
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT positive_household_size CHECK (household_size > 0),
    CONSTRAINT valid_income CHECK (annual_income >= 0),
    CONSTRAINT valid_employment_status CHECK (employment_status IN (
        'employed', 'unemployed', 'self_employed', 'retired', 'disabled', 'student'
    )),
    CONSTRAINT valid_background_check CHECK (background_check_status IN (
        'pending', 'in_progress', 'passed', 'failed', 'not_required'
    )),
    CONSTRAINT valid_credit_score CHECK (credit_score BETWEEN 300 AND 850)
);

-- Applications table with workflow support
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    application_number VARCHAR(50) UNIQUE,
    status VARCHAR(50) DEFAULT 'draft',
    priority_score DECIMAL(5,2),
    lottery_number INTEGER,
    wait_list_position INTEGER,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    documents JSONB DEFAULT '[]',
    workflow_state JSONB DEFAULT '{}',
    reviewer_notes TEXT,
    income_verification_status VARCHAR(50) DEFAULT 'pending',
    document_checklist JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_status CHECK (status IN (
        'draft', 'submitted', 'under_review', 'approved', 'rejected', 
        'waitlisted', 'offered', 'lease_signed', 'moved_in', 'withdrawn'
    )),
    CONSTRAINT unique_application UNIQUE (project_id, applicant_id),
    CONSTRAINT valid_priority_score CHECK (priority_score BETWEEN 0 AND 100),
    CONSTRAINT valid_income_verification CHECK (income_verification_status IN (
        'pending', 'verified', 'failed', 'not_required'
    ))
);

-- Contact submissions table
CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(20),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    category VARCHAR(100) DEFAULT 'general',
    responded_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_status CHECK (status IN ('new', 'in_progress', 'responded', 'closed')),
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Audit log table for compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Sessions table for JWT token management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read_at TIMESTAMPTZ,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_type CHECK (type IN (
        'application_update', 'system_alert', 'deadline_reminder', 
        'document_request', 'approval_notification', 'general'
    ))
);

-- File uploads table
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT positive_file_size CHECK (file_size > 0)
);

-- Create indexes for performance
CREATE INDEX idx_companies_company_key ON companies(company_key);
CREATE INDEX idx_companies_search ON companies USING GIN(search_vector);

CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_company ON users(role, company_id);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_location ON projects(location);
CREATE INDEX idx_projects_search ON projects USING GIN(search_vector);
CREATE INDEX idx_projects_coordinates ON projects(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_projects_completion_date ON projects(completion_date);
CREATE INDEX idx_projects_application_deadline ON projects(application_deadline);

CREATE INDEX idx_applicants_company_id ON applicants(company_id);
CREATE INDEX idx_applicants_email ON applicants(email);
CREATE INDEX idx_applicants_user_id ON applicants(user_id);
CREATE INDEX idx_applicants_search ON applicants USING GIN(search_vector);
CREATE INDEX idx_applicants_income ON applicants(annual_income);

CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_project_id ON applications(project_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at);
CREATE INDEX idx_applications_priority_score ON applications(priority_score DESC);
CREATE INDEX idx_applications_number ON applications(application_number);

CREATE INDEX idx_contact_status ON contact_submissions(status);
CREATE INDEX idx_contact_created_at ON contact_submissions(created_at);
CREATE INDEX idx_contact_category ON contact_submissions(category);

CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_file_uploads_company_id ON file_uploads(company_id);
CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_file_hash ON file_uploads(file_hash);

-- Create updated_at triggers
CREATE TRIGGER trigger_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_applicants_updated_at
    BEFORE UPDATE ON applicants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers (after audit_logs table exists)
-- Note: These will be added after migration to avoid circular dependencies

-- Create views for common queries
CREATE VIEW active_applications AS
SELECT 
    a.*,
    p.name as project_name,
    p.location as project_location,
    ap.first_name,
    ap.last_name,
    ap.email
FROM applications a
JOIN projects p ON a.project_id = p.id
JOIN applicants ap ON a.applicant_id = ap.id
WHERE a.status IN ('submitted', 'under_review', 'approved', 'waitlisted');

CREATE VIEW project_stats AS
SELECT 
    p.id,
    p.name,
    p.total_units,
    p.affordable_units,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved_applications,
    COUNT(CASE WHEN a.status = 'waitlisted' THEN 1 END) as waitlisted_applications,
    AVG(a.priority_score) as avg_priority_score
FROM projects p
LEFT JOIN applications a ON p.id = a.project_id
GROUP BY p.id, p.name, p.total_units, p.affordable_units;

-- Row Level Security (RLS) setup will be done after data migration
-- to avoid issues during the migration process