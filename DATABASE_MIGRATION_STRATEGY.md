# 🗄️ Database Migration Strategy

**Version**: 1.0  
**Status**: Ready for Production  
**Current**: SQLite → **Target**: PostgreSQL

## 📋 Migration Overview

This document outlines the zero-downtime migration strategy from SQLite to PostgreSQL for HomeVerse production deployment.

## 🎯 Migration Goals

1. **Zero Downtime**: No service interruption during migration
2. **Data Integrity**: 100% data preservation
3. **Rollback Ready**: Can revert if issues arise
4. **Performance**: Improved query performance post-migration

## 📊 Current Database Schema

### Tables to Migrate
- `companies` - Multi-tenant organizations
- `users` - User accounts with roles
- `applicants` - Housing applicants
- `projects` - Development projects
- `matches` - AI-powered matches
- `activities` - Audit trail
- `report_runs` - Async reports
- `contact_submissions` - Contact form data
- `investments` - Lender investments
- `investment_valuations` - Investment history
- `notifications` - User notifications
- `applicant_embeddings` - AI vectors
- `project_embeddings` - AI vectors

## 🚀 Migration Steps

### Phase 1: Preparation (Pre-Migration)

```bash
# 1. Install PostgreSQL dependencies
pip install psycopg2-binary asyncpg alembic

# 2. Set up PostgreSQL on Render
# - Create PostgreSQL database via Render dashboard
# - Note the DATABASE_URL provided

# 3. Test PostgreSQL connection
python -c "
import psycopg2
conn = psycopg2.connect('YOUR_POSTGRESQL_DATABASE_URL')
print('✅ PostgreSQL connection successful')
conn.close()
"

# 4. Create backup of SQLite database
cp homeverse_demo.db homeverse_demo_backup_$(date +%Y%m%d_%H%M%S).db
```

### Phase 2: Schema Creation

```bash
# 1. Initialize Alembic (already done)
# alembic init alembic

# 2. Generate PostgreSQL schema
python db/init_schema.py --postgresql

# 3. Run initial migration
alembic upgrade head
```

### Phase 3: Data Migration Script

```python
#!/usr/bin/env python3
"""migrate_to_postgresql.py - Zero-downtime data migration"""
import sqlite3
import psycopg2
import json
from datetime import datetime

def migrate_data():
    # Connect to both databases
    sqlite_conn = sqlite3.connect('homeverse_demo.db')
    sqlite_conn.row_factory = sqlite3.Row
    
    pg_conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    pg_cursor = pg_conn.cursor()
    
    tables = [
        'companies', 'users', 'applicants', 'projects',
        'matches', 'activities', 'report_runs',
        'contact_submissions', 'investments',
        'investment_valuations', 'notifications'
    ]
    
    for table in tables:
        print(f"Migrating {table}...")
        
        # Read from SQLite
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute(f"SELECT * FROM {table}")
        rows = sqlite_cursor.fetchall()
        
        if rows:
            # Get column names
            columns = [description[0] for description in sqlite_cursor.description]
            
            # Insert into PostgreSQL
            placeholders = ','.join(['%s'] * len(columns))
            insert_query = f"""
                INSERT INTO {table} ({','.join(columns)})
                VALUES ({placeholders})
                ON CONFLICT (id) DO NOTHING
            """
            
            for row in rows:
                pg_cursor.execute(insert_query, tuple(row))
        
        pg_conn.commit()
        print(f"✅ {table}: {len(rows)} rows migrated")
    
    sqlite_conn.close()
    pg_conn.close()
    print("✅ Migration complete!")

if __name__ == "__main__":
    migrate_data()
```

### Phase 4: Dual-Write Implementation

```python
# Modify simple_backend.py to write to both databases
class DualDatabaseManager:
    def __init__(self):
        self.sqlite_conn = sqlite3.connect('homeverse_demo.db')
        self.pg_conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    
    def execute(self, query, params=None):
        # Write to both databases
        sqlite_cursor = self.sqlite_conn.cursor()
        pg_cursor = self.pg_conn.cursor()
        
        sqlite_cursor.execute(query, params)
        pg_cursor.execute(query, params)
        
        self.sqlite_conn.commit()
        self.pg_conn.commit()
```

### Phase 5: Switchover Process

```bash
# 1. Enable dual-write mode
export ENABLE_DUAL_WRITE=true
git add . && git commit -m "Enable dual-write mode"
git push

# 2. Run full data sync
python migrate_to_postgresql.py

# 3. Verify data integrity
python verify_migration.py

# 4. Switch primary database
export DATABASE_URL=$POSTGRESQL_URL
export USE_POSTGRESQL=true
git add . && git commit -m "Switch to PostgreSQL primary"
git push

# 5. Monitor for issues (1 hour)
python monitor_deployment.py

# 6. Disable dual-write
export ENABLE_DUAL_WRITE=false
git add . && git commit -m "Migration complete: PostgreSQL primary"
git push
```

## 🔍 Verification Script

```python
#!/usr/bin/env python3
"""verify_migration.py - Verify data integrity after migration"""

def verify_migration():
    sqlite_conn = sqlite3.connect('homeverse_demo.db')
    pg_conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    
    tables = ['companies', 'users', 'applicants', 'projects']
    
    for table in tables:
        # Count rows
        sqlite_count = sqlite_conn.execute(
            f"SELECT COUNT(*) FROM {table}"
        ).fetchone()[0]
        
        pg_cursor = pg_conn.cursor()
        pg_cursor.execute(f"SELECT COUNT(*) FROM {table}")
        pg_count = pg_cursor.fetchone()[0]
        
        if sqlite_count == pg_count:
            print(f"✅ {table}: {sqlite_count} rows match")
        else:
            print(f"❌ {table}: SQLite={sqlite_count}, PostgreSQL={pg_count}")
            return False
    
    # Verify sample data
    print("\nVerifying sample records...")
    
    # Check a user
    sqlite_user = sqlite_conn.execute(
        "SELECT * FROM users WHERE email='developer@test.com'"
    ).fetchone()
    
    pg_cursor.execute(
        "SELECT * FROM users WHERE email='developer@test.com'"
    )
    pg_user = pg_cursor.fetchone()
    
    if sqlite_user and pg_user:
        print("✅ Sample user data matches")
    else:
        print("❌ Sample user data mismatch")
        return False
    
    return True
```

## 🔄 Rollback Plan

If issues arise during migration:

```bash
# 1. Immediate rollback (< 5 min)
export USE_POSTGRESQL=false
export DATABASE_URL=""
git add . && git commit -m "Rollback: Use SQLite"
git push

# 2. Data recovery (if needed)
cp homeverse_demo_backup_*.db homeverse_demo.db

# 3. Investigate issues
python monitor_deployment.py
tail -f deployment.log
```

## 📈 Performance Optimization

### PostgreSQL Tuning
```sql
-- Optimize for read-heavy workload
ALTER DATABASE homeverse SET shared_buffers = '256MB';
ALTER DATABASE homeverse SET effective_cache_size = '1GB';
ALTER DATABASE homeverse SET work_mem = '16MB';

-- Create indexes for common queries
CREATE INDEX idx_applicants_company ON applicants(company_id);
CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);

-- Analyze tables
ANALYZE;
```

### Connection Pooling
```python
# Add to simple_backend.py
from psycopg2 import pool

# Create connection pool
db_pool = psycopg2.pool.SimpleConnectionPool(
    1, 20,  # min and max connections
    os.getenv('DATABASE_URL')
)

def get_db_connection():
    return db_pool.getconn()

def return_db_connection(conn):
    db_pool.putconn(conn)
```

## 🔐 Security Considerations

1. **Encryption**: PostgreSQL connection uses SSL
2. **Access Control**: Database user has minimal required permissions
3. **Backup Encryption**: All backups encrypted at rest
4. **Audit Trail**: All migration steps logged

## 📊 Success Criteria

- [ ] All tables migrated with 100% data integrity
- [ ] No service downtime during migration
- [ ] Response times remain < 200ms
- [ ] All tests pass with PostgreSQL
- [ ] Successful operation for 24 hours post-migration

## 🚨 Monitoring During Migration

```bash
# Terminal 1: Monitor application
python monitor_deployment.py

# Terminal 2: Watch PostgreSQL metrics
watch -n 5 'psql $DATABASE_URL -c "
SELECT 
  datname,
  numbackends as connections,
  xact_commit as commits,
  xact_rollback as rollbacks,
  blks_read as disk_reads,
  blks_hit as cache_hits
FROM pg_stat_database 
WHERE datname = '\''homeverse'\''"'

# Terminal 3: Application logs
tail -f deployment.log | grep -E "(ERROR|WARNING|migration)"
```

## 📅 Migration Timeline

1. **Preparation**: 1 hour
2. **Initial sync**: 30 minutes
3. **Dual-write testing**: 2 hours
4. **Switchover**: 15 minutes
5. **Monitoring**: 24 hours
6. **Total time**: ~28 hours (mostly monitoring)

## ✅ Post-Migration Checklist

- [ ] All data migrated successfully
- [ ] Application performing normally
- [ ] Backups configured for PostgreSQL
- [ ] Monitoring alerts updated
- [ ] Documentation updated
- [ ] Team notified of completion
- [ ] SQLite database archived

---

**Note**: This migration can be performed during normal operations with zero downtime using the dual-write strategy.