#!/usr/bin/env python3
"""
HomeVerse Database Migration: SQLite to PostgreSQL
Migrates all data while preserving relationships and adding enhancements
"""

import sqlite3
import asyncpg
import asyncio
import os
import json
import sys
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import uuid
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuration
SQLITE_DB_PATH = 'homeverse.db'
POSTGRESQL_URL = os.getenv('DATABASE_URL', 'postgresql://homeverse:secure_password123@localhost:5432/homeverse_dev')

class DatabaseMigrator:
    def __init__(self, sqlite_path: str, postgres_url: str):
        self.sqlite_path = sqlite_path
        self.postgres_url = postgres_url
        self.sqlite_conn = None
        self.postgres_conn = None
        self.migration_stats = {}
        
    async def connect(self):
        """Establish connections to both databases"""
        try:
            # SQLite connection
            self.sqlite_conn = sqlite3.connect(self.sqlite_path)
            self.sqlite_conn.row_factory = sqlite3.Row
            logger.info("✅ Connected to SQLite database")
            
            # PostgreSQL connection
            self.postgres_conn = await asyncpg.connect(self.postgres_url)
            logger.info("✅ Connected to PostgreSQL database")
            
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise
    
    async def disconnect(self):
        """Close database connections"""
        if self.sqlite_conn:
            self.sqlite_conn.close()
        if self.postgres_conn:
            await self.postgres_conn.close()
    
    def get_sqlite_tables(self) -> List[str]:
        """Get list of tables in SQLite database"""
        cursor = self.sqlite_conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        return [row[0] for row in cursor.fetchall()]
    
    async def validate_postgresql_schema(self) -> bool:
        """Validate that PostgreSQL schema is ready"""
        try:
            # Check if main tables exist
            required_tables = ['companies', 'users', 'projects', 'applicants', 'applications']
            
            for table in required_tables:
                result = await self.postgres_conn.fetchval(
                    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
                    table
                )
                if not result:
                    logger.error(f"❌ Required table '{table}' not found in PostgreSQL")
                    return False
            
            logger.info("✅ PostgreSQL schema validation passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Schema validation failed: {e}")
            return False
    
    def convert_sqlite_row(self, row: sqlite3.Row, table_name: str) -> Dict[str, Any]:
        """Convert SQLite row to PostgreSQL-compatible format"""
        data = dict(row)
        
        # Convert string IDs to UUIDs where needed
        if 'id' in data and isinstance(data['id'], str):
            try:
                # If it's already a valid UUID, keep it
                uuid.UUID(data['id'])
            except ValueError:
                # Generate new UUID for invalid formats
                data['id'] = str(uuid.uuid4())
        
        # Handle company_id references
        if 'company_id' in data and isinstance(data['company_id'], str):
            try:
                uuid.UUID(data['company_id'])
            except ValueError:
                # Map to a default company or generate new
                data['company_id'] = str(uuid.uuid4())
        
        # Convert datetime strings to proper format
        for field in ['created_at', 'updated_at', 'submitted_at', 'reviewed_at', 'approved_at']:
            if field in data and data[field]:
                try:
                    # Parse various datetime formats
                    if isinstance(data[field], str):
                        # Try common formats
                        for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%dT%H:%M:%S']:
                            try:
                                dt = datetime.strptime(data[field], fmt)
                                data[field] = dt
                                break
                            except ValueError:
                                continue
                except Exception:
                    data[field] = datetime.now()
        
        # Handle JSON fields
        json_fields = {
            'companies': ['settings', 'billing_info'],
            'users': ['preferences'],
            'projects': ['amenities'],
            'applicants': ['unit_preferences', 'accessibility_needs', 'documents'],
            'applications': ['documents', 'workflow_state', 'document_checklist'],
            'notifications': ['metadata'],
            'file_uploads': ['metadata']
        }
        
        if table_name in json_fields:
            for field in json_fields[table_name]:
                if field in data:
                    if isinstance(data[field], str):
                        try:
                            data[field] = json.loads(data[field])
                        except (json.JSONDecodeError, TypeError):
                            data[field] = {} if field.endswith('_info') or field == 'preferences' else []
                    elif data[field] is None:
                        data[field] = {} if field.endswith('_info') or field == 'preferences' else []
        
        # Handle array fields
        array_fields = {
            'projects': ['ami_levels', 'unit_types', 'images'],
            'applicants': ['preferred_locations']
        }
        
        if table_name in array_fields:
            for field in array_fields[table_name]:
                if field in data and data[field]:
                    if isinstance(data[field], str):
                        # Try to parse as JSON array, fallback to comma-separated
                        try:
                            data[field] = json.loads(data[field])
                        except json.JSONDecodeError:
                            data[field] = [item.strip() for item in data[field].split(',')]
                elif field in data:
                    data[field] = []
        
        return data
    
    async def migrate_table(self, table_name: str, dry_run: bool = False) -> Dict[str, int]:
        """Migrate a single table from SQLite to PostgreSQL"""
        logger.info(f"🔄 Migrating table: {table_name}")
        
        try:
            # Get data from SQLite
            cursor = self.sqlite_conn.cursor()
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            
            if not rows:
                logger.info(f"📭 No data found in {table_name}")
                return {'source_count': 0, 'migrated_count': 0}
            
            logger.info(f"📊 Found {len(rows)} records in {table_name}")
            
            if dry_run:
                logger.info(f"🔍 DRY RUN: Would migrate {len(rows)} records")
                return {'source_count': len(rows), 'migrated_count': 0}
            
            # Convert and insert data
            migrated_count = 0
            
            for row in rows:
                try:
                    data = self.convert_sqlite_row(row, table_name)
                    
                    # Build INSERT query
                    columns = list(data.keys())
                    placeholders = [f'${i+1}' for i in range(len(columns))]
                    values = [data[col] for col in columns]
                    
                    query = f"""
                    INSERT INTO {table_name} ({', '.join(columns)})
                    VALUES ({', '.join(placeholders)})
                    ON CONFLICT (id) DO UPDATE SET
                    updated_at = CURRENT_TIMESTAMP
                    """
                    
                    await self.postgres_conn.execute(query, *values)
                    migrated_count += 1
                    
                except Exception as e:
                    logger.warning(f"⚠️ Failed to migrate row in {table_name}: {e}")
                    continue
            
            logger.info(f"✅ Successfully migrated {migrated_count}/{len(rows)} records from {table_name}")
            return {'source_count': len(rows), 'migrated_count': migrated_count}
            
        except Exception as e:
            logger.error(f"❌ Failed to migrate table {table_name}: {e}")
            return {'source_count': 0, 'migrated_count': 0, 'error': str(e)}
    
    async def create_default_data(self):
        """Create default company and users for testing"""
        logger.info("🏢 Creating default test data...")
        
        try:
            # Create default company
            company_id = str(uuid.uuid4())
            await self.postgres_conn.execute("""
            INSERT INTO companies (id, company_key, name, plan, max_seats)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (company_key) DO NOTHING
            """, company_id, "test-company", "HomeVerse Test Company", "professional", 100)
            
            # Create test users
            test_users = [
                {"email": "developer@test.com", "password": "password123", "role": "developer"},
                {"email": "lender@test.com", "password": "password123", "role": "lender"},
                {"email": "buyer@test.com", "password": "password123", "role": "buyer"},
                {"email": "applicant@test.com", "password": "password123", "role": "applicant"},
                {"email": "admin@test.com", "password": "password123", "role": "admin"},
            ]
            
            for user_data in test_users:
                user_id = str(uuid.uuid4())
                # Simple password hash (in production, use proper bcrypt)
                password_hash = f"hashed_{user_data['password']}"
                
                await self.postgres_conn.execute("""
                INSERT INTO users (id, company_id, email, password_hash, role, first_name, last_name, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (email) DO NOTHING
                """, user_id, company_id, user_data["email"], password_hash, 
                user_data["role"], user_data["role"].title(), "User", True)
            
            logger.info("✅ Default test data created")
            
        except Exception as e:
            logger.error(f"❌ Failed to create default data: {e}")
    
    async def verify_migration(self) -> bool:
        """Verify migration integrity"""
        logger.info("🔍 Verifying migration integrity...")
        
        try:
            # Define table dependencies (child -> parent)
            tables_to_check = ['companies', 'users', 'projects', 'applicants', 'applications']
            
            for table in tables_to_check:
                # Count records in both databases
                sqlite_count = self.sqlite_conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                postgres_count = await self.postgres_conn.fetchval(f"SELECT COUNT(*) FROM {table}")
                
                logger.info(f"📊 {table}: SQLite={sqlite_count}, PostgreSQL={postgres_count}")
                
                if sqlite_count > 0 and postgres_count == 0:
                    logger.error(f"❌ No data migrated for table {table}")
                    return False
            
            # Check foreign key relationships
            orphaned_users = await self.postgres_conn.fetchval("""
            SELECT COUNT(*) FROM users u 
            LEFT JOIN companies c ON u.company_id = c.id 
            WHERE c.id IS NULL
            """)
            
            if orphaned_users > 0:
                logger.warning(f"⚠️ Found {orphaned_users} orphaned users")
            
            logger.info("✅ Migration verification completed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Migration verification failed: {e}")
            return False
    
    async def setup_row_level_security(self):
        """Set up Row Level Security policies"""
        logger.info("🔒 Setting up Row Level Security...")
        
        try:
            # Enable RLS on tables
            tables_with_rls = ['companies', 'users', 'projects', 'applicants', 'applications', 'notifications']
            
            for table in tables_with_rls:
                await self.postgres_conn.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
            
            # Create policies
            await self.postgres_conn.execute("""
            CREATE POLICY company_isolation_users ON users
                FOR ALL TO PUBLIC
                USING (company_id = current_setting('app.current_company_id', true)::UUID)
            """)
            
            await self.postgres_conn.execute("""
            CREATE POLICY company_isolation_projects ON projects
                FOR ALL TO PUBLIC
                USING (company_id = current_setting('app.current_company_id', true)::UUID)
            """)
            
            await self.postgres_conn.execute("""
            CREATE POLICY company_isolation_applicants ON applicants
                FOR ALL TO PUBLIC
                USING (company_id = current_setting('app.current_company_id', true)::UUID)
            """)
            
            await self.postgres_conn.execute("""
            CREATE POLICY company_isolation_applications ON applications
                FOR ALL TO PUBLIC
                USING (company_id = current_setting('app.current_company_id', true)::UUID)
            """)
            
            logger.info("✅ Row Level Security configured")
            
        except Exception as e:
            # RLS policies might already exist
            logger.warning(f"⚠️ RLS setup warning: {e}")
    
    async def run_migration(self, dry_run: bool = False, create_defaults: bool = True):
        """Run the complete migration process"""
        logger.info("🚀 Starting PostgreSQL migration...")
        
        try:
            await self.connect()
            
            if not await self.validate_postgresql_schema():
                raise Exception("PostgreSQL schema validation failed")
            
            # Check if SQLite database exists
            if not os.path.exists(self.sqlite_path):
                logger.info("📭 No SQLite database found - setting up fresh PostgreSQL database")
                if create_defaults:
                    await self.create_default_data()
                logger.info("✅ Fresh PostgreSQL database setup completed")
                return
            
            # Get tables from SQLite
            sqlite_tables = self.get_sqlite_tables()
            logger.info(f"📋 Found SQLite tables: {sqlite_tables}")
            
            # Migration order (respecting foreign key dependencies)
            migration_order = ['companies', 'users', 'projects', 'applicants', 'applications', 'contact_submissions']
            
            total_stats = {'total_source': 0, 'total_migrated': 0}
            
            for table in migration_order:
                if table in sqlite_tables:
                    stats = await self.migrate_table(table, dry_run)
                    self.migration_stats[table] = stats
                    total_stats['total_source'] += stats.get('source_count', 0)
                    total_stats['total_migrated'] += stats.get('migrated_count', 0)
                else:
                    logger.info(f"⏭️ Skipping {table} (not found in SQLite)")
            
            if not dry_run:
                if create_defaults:
                    await self.create_default_data()
                
                # Verify migration
                if await self.verify_migration():
                    logger.info("✅ Migration verification passed")
                else:
                    logger.warning("⚠️ Migration verification had issues")
                
                # Set up RLS
                await self.setup_row_level_security()
            
            # Print summary
            logger.info("📊 Migration Summary:")
            for table, stats in self.migration_stats.items():
                source = stats.get('source_count', 0)
                migrated = stats.get('migrated_count', 0)
                status = "✅" if migrated == source else "⚠️"
                logger.info(f"  {status} {table}: {migrated}/{source}")
            
            logger.info(f"🎉 Migration completed! Total: {total_stats['total_migrated']}/{total_stats['total_source']} records")
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            raise
        finally:
            await self.disconnect()

async def main():
    parser = argparse.ArgumentParser(description='Migrate HomeVerse from SQLite to PostgreSQL')
    parser.add_argument('--dry-run', action='store_true', help='Run migration without making changes')
    parser.add_argument('--no-defaults', action='store_true', help='Skip creating default test data')
    parser.add_argument('--create-defaults', action='store_true', help='Force create default test data')
    parser.add_argument('--sqlite-path', default=SQLITE_DB_PATH, help='Path to SQLite database')
    parser.add_argument('--postgres-url', default=POSTGRESQL_URL, help='PostgreSQL connection URL')
    
    args = parser.parse_args()
    
    migrator = DatabaseMigrator(args.sqlite_path, args.postgres_url)
    
    try:
        # Determine if we should create defaults
        create_defaults = args.create_defaults or not args.no_defaults
        
        await migrator.run_migration(
            dry_run=args.dry_run,
            create_defaults=create_defaults
        )
        logger.info("🏁 Migration process completed successfully!")
        
    except Exception as e:
        logger.error(f"💥 Migration process failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())