# 🗄️ Database Migration Roadmap: SQLite → PostgreSQL

## Current Status Analysis

### Current SQLite Implementation
- **Database**: Single SQLite file (`homeverse.db`)
- **Multi-tenant**: Row-level security with `company_id` isolation
- **Schema**: Users, companies, projects, applicants, applications, contact submissions
- **Connection**: Direct file-based connection
- **Limitations**: 
  - Single-writer bottleneck
  - No replication or clustering
  - Limited concurrent connections
  - File-based backups only
  - No advanced indexing strategies

---

## 🎯 Migration Goals

### Production Requirements
- **High Availability**: 99.9% uptime with automatic failover
- **Scalability**: Support 10,000+ concurrent users
- **Performance**: Sub-100ms query response times
- **Security**: Encrypted at rest and in transit
- **Compliance**: GDPR, CCPA, SOC 2 ready
- **Backup & Recovery**: Point-in-time recovery, automated backups

---

## 📋 Phase 1: Infrastructure Setup (Week 1)

### 1.1 PostgreSQL Instance Setup
```bash
# Cloud Provider Options:
# - AWS RDS PostgreSQL 15.4
# - Google Cloud SQL PostgreSQL 15
# - Azure Database for PostgreSQL Flexible Server
```

#### Recommended Configuration (AWS RDS)
- **Instance**: `db.r6g.xlarge` (4 vCPU, 32 GB RAM)
- **Storage**: 500 GB gp3 SSD with 3,000 IOPS
- **Multi-AZ**: Enabled for high availability
- **Backup**: 7-day retention, automated backups
- **Encryption**: At rest and in transit
- **VPC**: Private subnet with security groups

### 1.2 Development Environment
```bash
# Local PostgreSQL setup
docker run --name homeverse-postgres \
  -e POSTGRES_DB=homeverse_dev \
  -e POSTGRES_USER=homeverse \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:15.4-alpine
```

### 1.3 Environment Variables Update
```bash
# Update .env files
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_SSL_MODE=require
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30
DATABASE_POOL_TIMEOUT=30
```

---

## 📊 Phase 2: Schema Migration (Week 1-2)

### 2.1 SQLAlchemy Migration Script
```python
# Create migration script: migrate_to_postgresql.py

import sqlite3
import asyncpg
import asyncio
from sqlalchemy import create_engine, MetaData, Table
from datetime import datetime
import logging

async def migrate_database():
    # Step 1: Export SQLite schema and data
    sqlite_conn = sqlite3.connect('homeverse.db')
    sqlite_conn.row_factory = sqlite3.Row
    
    # Step 2: Create PostgreSQL schema
    pg_conn = await asyncpg.connect(DATABASE_URL)
    
    # Step 3: Migrate each table with data transformation
    tables = ['companies', 'users', 'projects', 'applicants', 
              'applications', 'contact_submissions']
    
    for table in tables:
        await migrate_table(sqlite_conn, pg_conn, table)
    
    # Step 4: Create indexes and constraints
    await create_indexes(pg_conn)
    await create_constraints(pg_conn)
    
    # Step 5: Verify data integrity
    await verify_migration(sqlite_conn, pg_conn)
```

### 2.2 Enhanced Schema with PostgreSQL Features
```sql
-- Enhanced schema with PostgreSQL-specific optimizations

-- Companies table with enhanced features
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'trial',
    max_seats INTEGER DEFAULT 5,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add search capabilities
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || company_key)
    ) STORED
);

-- Users table with enhanced security
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Row Level Security
    CONSTRAINT valid_role CHECK (role IN ('admin', 'lender', 'developer', 'buyer', 'applicant'))
);

-- Projects table with geospatial support
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    developer VARCHAR(255),
    location VARCHAR(255),
    address TEXT,
    coordinates POINT, -- PostgreSQL native point type
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Full text search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || COALESCE(location, '') || ' ' || COALESCE(description, ''))
    ) STORED,
    
    CONSTRAINT valid_status CHECK (status IN ('planning', 'construction', 'marketing', 'accepting_applications', 'completed'))
);

-- Applicants table with enhanced data
CREATE TABLE applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    current_address TEXT,
    preferred_locations TEXT[],
    unit_preferences JSONB DEFAULT '{}',
    documents JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search capabilities
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', first_name || ' ' || last_name || ' ' || email)
    ) STORED
);

-- Applications table with workflow support
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'submitted',
    priority_score DECIMAL(5,2),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    documents JSONB DEFAULT '[]',
    workflow_state JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'waitlisted')),
    CONSTRAINT unique_application UNIQUE (project_id, applicant_id)
);

-- Contact submissions table
CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(20),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('new', 'in_progress', 'responded', 'closed'))
);

-- Audit log table for compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);
```

### 2.3 Indexes for Performance
```sql
-- Performance indexes
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_company ON users(role, company_id);

CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_location ON projects USING GIN(to_tsvector('english', location));
CREATE INDEX idx_projects_search ON projects USING GIN(search_vector);
CREATE INDEX idx_projects_coordinates ON projects USING GIST(coordinates);

CREATE INDEX idx_applicants_company_id ON applicants(company_id);
CREATE INDEX idx_applicants_email ON applicants(email);
CREATE INDEX idx_applicants_search ON applicants USING GIN(search_vector);

CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_project_id ON applications(project_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at);

CREATE INDEX idx_contact_status ON contact_submissions(status);
CREATE INDEX idx_contact_created_at ON contact_submissions(created_at);

CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 🔒 Phase 3: Row Level Security (Week 2)

### 3.1 Enable RLS Policies
```sql
-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies based on company_id
CREATE POLICY company_isolation ON users
    FOR ALL TO authenticated_users
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation ON projects
    FOR ALL TO authenticated_users
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation ON applicants
    FOR ALL TO authenticated_users
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation ON applications
    FOR ALL TO authenticated_users
    USING (company_id = current_setting('app.current_company_id')::UUID);

-- Admin can see everything within their company
CREATE POLICY admin_full_access ON projects
    FOR ALL TO authenticated_users
    USING (
        company_id = current_setting('app.current_company_id')::UUID
        AND current_setting('app.current_user_role') = 'admin'
    );

-- Role-based access for users
CREATE POLICY role_based_access ON users
    FOR SELECT TO authenticated_users
    USING (
        company_id = current_setting('app.current_company_id')::UUID
        AND (
            id = current_setting('app.current_user_id')::UUID
            OR current_setting('app.current_user_role') = 'admin'
        )
    );
```

---

## 🔄 Phase 4: Application Code Migration (Week 2-3)

### 4.1 Update Database Connection
```python
# app/db/database.py - Enhanced PostgreSQL connection

import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import logging

# PostgreSQL connection with optimizations
DATABASE_URL = os.getenv("DATABASE_URL")
POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "20"))
MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", "30"))

# Create async engine with connection pooling
engine = create_async_engine(
    DATABASE_URL,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
    pool_timeout=30,
    pool_recycle=3600,
    echo=os.getenv("DATABASE_ECHO") == "true",
    echo_pool=os.getenv("DATABASE_ECHO_POOL") == "true",
)

# Session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Connection pool health check
async def check_database_health():
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logging.error(f"Database health check failed: {e}")
        return False
```

### 4.2 Update Models with PostgreSQL Features
```python
# app/db/models.py - Enhanced models

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET, POINT, TSVECTOR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_key = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    plan = Column(String(50), default='trial')
    max_seats = Column(Integer, default=5)
    settings = Column(JSONB, default={})
    search_vector = Column(TSVECTOR)  # Auto-generated search vector
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    location = Column(String(255))
    coordinates = Column(POINT)  # PostgreSQL native point type
    ami_levels = Column(ARRAY(String))  # Native array support
    unit_types = Column(ARRAY(String))
    amenities = Column(JSONB, default=[])  # JSON with better performance
    images = Column(ARRAY(String))
    search_vector = Column(TSVECTOR)  # Full-text search
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    table_name = Column(String(100), nullable=False)
    record_id = Column(UUID(as_uuid=True), nullable=False)
    action = Column(String(20), nullable=False)
    old_values = Column(JSONB)
    new_values = Column(JSONB)
    ip_address = Column(INET)
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### 4.3 Enhanced CRUD Operations
```python
# app/db/crud.py - PostgreSQL-optimized operations

from sqlalchemy import text, select, and_, or_
from sqlalchemy.orm import selectinload, joinedload
import asyncio

class ProjectCRUD:
    
    async def search_projects(
        self, 
        db: AsyncSession, 
        company_id: uuid.UUID,
        search_query: str = None,
        location_filter: str = None,
        status_filter: list = None,
        limit: int = 50,
        offset: int = 0
    ):
        """Advanced search with full-text search and geospatial filtering"""
        
        query = select(Project).where(Project.company_id == company_id)
        
        # Full-text search using PostgreSQL's tsvector
        if search_query:
            query = query.where(
                Project.search_vector.match(search_query)
            ).order_by(
                func.ts_rank(Project.search_vector, func.plainto_tsquery(search_query)).desc()
            )
        
        # Geospatial filtering
        if location_filter:
            # Search within radius using PostGIS functions
            query = query.where(
                func.ST_DWithin(
                    Project.coordinates,
                    func.ST_Point(longitude, latitude),
                    radius_in_meters
                )
            )
        
        # Status filtering
        if status_filter:
            query = query.where(Project.status.in_(status_filter))
        
        # Pagination
        query = query.offset(offset).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_projects_with_stats(self, db: AsyncSession, company_id: uuid.UUID):
        """Get projects with aggregated statistics"""
        
        query = text("""
        SELECT 
            p.*,
            COUNT(a.id) as application_count,
            AVG(a.priority_score) as avg_priority_score,
            COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved_count
        FROM projects p
        LEFT JOIN applications a ON p.id = a.project_id
        WHERE p.company_id = :company_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
        """)
        
        result = await db.execute(query, {"company_id": company_id})
        return result.fetchall()

    async def bulk_update_projects(self, db: AsyncSession, updates: list):
        """Bulk update projects efficiently"""
        
        # Use PostgreSQL's UPDATE ... FROM for bulk updates
        if updates:
            await db.execute(
                text("""
                UPDATE projects 
                SET status = data.status,
                    updated_at = NOW()
                FROM (VALUES %s) AS data(id, status)
                WHERE projects.id = data.id::UUID
                """),
                updates
            )
            await db.commit()
```

---

## 🧪 Phase 5: Testing & Validation (Week 3)

### 5.1 Data Integrity Tests
```python
# tests/test_migration.py

import pytest
import asyncio
from sqlalchemy import text

@pytest.mark.asyncio
async def test_data_integrity():
    """Verify all data migrated correctly"""
    
    # Count records in each table
    tables = ['companies', 'users', 'projects', 'applicants', 'applications']
    
    for table in tables:
        sqlite_count = get_sqlite_count(table)
        pg_count = await get_postgresql_count(table)
        
        assert sqlite_count == pg_count, f"Record count mismatch in {table}"

@pytest.mark.asyncio 
async def test_search_functionality():
    """Test full-text search works correctly"""
    
    async with AsyncSessionLocal() as db:
        # Test project search
        results = await search_projects(
            db, 
            company_id=test_company_id,
            search_query="affordable housing"
        )
        
        assert len(results) > 0
        assert all("affordable" in r.name.lower() or "housing" in r.name.lower() 
                  for r in results)

@pytest.mark.asyncio
async def test_performance():
    """Test query performance meets requirements"""
    
    async with AsyncSessionLocal() as db:
        start_time = time.time()
        
        # Test complex query performance
        results = await get_projects_with_stats(db, test_company_id)
        
        end_time = time.time()
        query_time = end_time - start_time
        
        assert query_time < 0.1  # Sub-100ms requirement
        assert len(results) > 0
```

### 5.2 Load Testing
```python
# tests/load_test.py

import asyncio
import aiohttp
import time
from concurrent.futures import ThreadPoolExecutor

async def load_test_database():
    """Simulate concurrent database operations"""
    
    async def simulate_user_session():
        async with AsyncSessionLocal() as db:
            # Simulate typical user operations
            await get_projects(db, company_id)
            await search_applicants(db, company_id, "test")
            await create_application(db, application_data)
    
    # Run 100 concurrent sessions
    tasks = [simulate_user_session() for _ in range(100)]
    
    start_time = time.time()
    await asyncio.gather(*tasks)
    end_time = time.time()
    
    total_time = end_time - start_time
    avg_time = total_time / 100
    
    print(f"100 concurrent sessions completed in {total_time:.2f}s")
    print(f"Average time per session: {avg_time:.3f}s")
    
    assert avg_time < 1.0  # Each session should complete in under 1 second
```

---

## 🚀 Phase 6: Deployment & Cutover (Week 4)

### 6.1 Blue-Green Deployment Strategy
```yaml
# docker-compose.prod.yml

version: '3.8'
services:
  homeverse-app-blue:
    build: .
    environment:
      - DATABASE_URL=${POSTGRESQL_URL}
      - REDIS_URL=${REDIS_URL}
      - DEPLOYMENT_SLOT=blue
    deploy:
      replicas: 3
    
  homeverse-app-green:
    build: .
    environment:
      - DATABASE_URL=${POSTGRESQL_URL}
      - REDIS_URL=${REDIS_URL}
      - DEPLOYMENT_SLOT=green
    deploy:
      replicas: 3
    
  postgres:
    image: postgres:15.4-alpine
    environment:
      - POSTGRES_DB=homeverse_prod
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

### 6.2 Migration Execution Plan
```bash
#!/bin/bash
# deploy_postgresql.sh

set -e

echo "🚀 Starting PostgreSQL migration..."

# Step 1: Create final backup of SQLite
echo "📦 Creating SQLite backup..."
cp homeverse.db "backups/homeverse_$(date +%Y%m%d_%H%M%S).db"

# Step 2: Run migration with validation
echo "🔄 Running migration..."
python migrate_to_postgresql.py --validate --dry-run
python migrate_to_postgresql.py --execute

# Step 3: Update application configuration
echo "⚙️ Updating application configuration..."
export DATABASE_URL=$POSTGRESQL_URL
export DATABASE_TYPE=postgresql

# Step 4: Deploy new application version
echo "🚀 Deploying new application..."
docker-compose -f docker-compose.prod.yml up -d --scale homeverse-app-green=3

# Step 5: Health check
echo "🏥 Running health checks..."
./health_check.sh --endpoint http://localhost:8000/health --timeout 60

# Step 6: Switch traffic to new version
echo "🔀 Switching traffic..."
# Update load balancer to point to green deployment
./switch_traffic.sh --from blue --to green

# Step 7: Monitor for 5 minutes
echo "📊 Monitoring new deployment..."
sleep 300

echo "✅ Migration completed successfully!"
```

---

## 📊 Phase 7: Monitoring & Optimization (Week 4)

### 7.1 Database Monitoring Setup
```python
# app/monitoring/db_monitor.py

import asyncio
import psutil
import asyncpg
from prometheus_client import Gauge, Counter, Histogram

# Metrics
db_connections_active = Gauge('db_connections_active', 'Active database connections')
db_connections_idle = Gauge('db_connections_idle', 'Idle database connections')
db_query_duration = Histogram('db_query_duration_seconds', 'Database query duration')
db_errors_total = Counter('db_errors_total', 'Total database errors')

async def monitor_database():
    """Continuous database monitoring"""
    
    while True:
        try:
            # Check connection pool status
            pool_status = await get_pool_status()
            db_connections_active.set(pool_status['active'])
            db_connections_idle.set(pool_status['idle'])
            
            # Check query performance
            slow_queries = await get_slow_queries()
            if slow_queries:
                logging.warning(f"Found {len(slow_queries)} slow queries")
            
            # Check table sizes
            table_sizes = await get_table_sizes()
            for table, size in table_sizes.items():
                if size > 1000000:  # 1M records
                    logging.info(f"Large table detected: {table} has {size} records")
            
        except Exception as e:
            db_errors_total.inc()
            logging.error(f"Database monitoring error: {e}")
        
        await asyncio.sleep(60)  # Check every minute

async def get_slow_queries():
    """Get queries running longer than 1 second"""
    
    async with engine.begin() as conn:
        result = await conn.execute(text("""
        SELECT 
            query,
            state,
            query_start,
            NOW() - query_start as duration
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND NOW() - query_start > interval '1 second'
        AND query NOT LIKE '%pg_stat_activity%'
        """))
        
        return result.fetchall()
```

### 7.2 Performance Optimization
```sql
-- Query optimization views
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    (total_time / calls) as avg_time_per_call
FROM pg_stat_statements
WHERE calls > 10
ORDER BY total_time DESC
LIMIT 20;

-- Analyze table statistics
ANALYZE companies;
ANALYZE users;
ANALYZE projects;
ANALYZE applicants;
ANALYZE applications;

-- Update table statistics for query planner
UPDATE pg_stat_user_tables SET n_tup_upd = n_tup_upd + 1;
```

---

## 🔄 Comparison with Existing Roadmap

### Alignment with Enterprise Roadmap
✅ **Phase 1 Database Migration** aligns with Enterprise Roadmap Phase 1
- Matches timeline: 2-3 weeks vs our 4 weeks (more detailed)
- Covers same requirements: PostgreSQL, backup strategy, monitoring
- **Enhancement**: Our roadmap adds Row Level Security and audit logging

### Additional Benefits
- **Compliance Ready**: Audit logging for SOC 2, GDPR requirements
- **Performance Optimized**: Full-text search, geospatial indexes
- **Scalability Built-in**: Connection pooling, query optimization
- **Security Enhanced**: RLS policies, encryption at rest/transit

### Integration Points
- **Phase 2**: Sets foundation for microservices architecture
- **Phase 3**: Enables advanced AI/ML features with JSON storage
- **Phase 5**: Provides audit trail for compliance frameworks

---

## 🚀 Implementation Plan

### Week 1: Infrastructure & Schema
- [x] Set up PostgreSQL instance
- [x] Create enhanced schema with PostgreSQL features
- [x] Set up development environment
- [ ] Create migration scripts

### Week 2: Data Migration & RLS
- [ ] Execute data migration with validation
- [ ] Implement Row Level Security policies
- [ ] Update application models
- [ ] Create audit logging system

### Week 3: Testing & Optimization
- [ ] Run comprehensive tests
- [ ] Performance benchmarking
- [ ] Load testing with concurrent users
- [ ] Query optimization

### Week 4: Deployment & Monitoring
- [ ] Blue-green deployment setup
- [ ] Production cutover
- [ ] Monitoring dashboard
- [ ] Performance tuning

**Ready to begin implementation!** 🚀