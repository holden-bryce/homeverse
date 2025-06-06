"""Initial schema with RLS policies

Revision ID: 0001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
import geoalchemy2
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "postgis"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "h3"')
    
    # Create companies table
    op.create_table('companies',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('uuid_generate_v4()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.Column('key', sa.String(50), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('plan', sa.String(50), nullable=False, default='basic'),
        sa.Column('seats', sa.Integer, nullable=False, default=10),
        sa.Column('settings', sa.JSON, nullable=False, default=sa.text("'{}'")),
    )
    op.create_index('ix_companies_key', 'companies', ['key'])
    
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('uuid_generate_v4()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, default='user'),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('last_login', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_company_id', 'users', ['company_id'])
    
    # Create applicants table
    op.create_table('applicants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('uuid_generate_v4()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('geo_point', geoalchemy2.Geography('POINT', srid=4326), nullable=False),
        sa.Column('ami_band', sa.String(10), nullable=False),
        sa.Column('household_size', sa.Integer, nullable=False),
        sa.Column('preferences', sa.JSON, nullable=False, default=sa.text("'{}'")),
        sa.Column('status', sa.String(50), nullable=False, default='active'),
    )
    op.create_index('ix_applicants_company_id', 'applicants', ['company_id'])
    op.create_index('ix_applicants_ami_band', 'applicants', ['ami_band'])
    
    # Create projects table
    op.create_table('projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('uuid_generate_v4()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('developer_name', sa.String(255), nullable=False),
        sa.Column('location', geoalchemy2.Geography('POINT', srid=4326), nullable=False),
        sa.Column('unit_count', sa.Integer, nullable=False),
        sa.Column('ami_min', sa.Integer, nullable=False),
        sa.Column('ami_max', sa.Integer, nullable=False),
        sa.Column('est_delivery', sa.String(50)),
        sa.Column('metadata_json', sa.JSON, nullable=False, default=sa.text("'{}'")),
        sa.Column('status', sa.String(50), nullable=False, default='active'),
    )
    op.create_index('ix_projects_company_id', 'projects', ['company_id'])
    op.create_index('ix_projects_name', 'projects', ['name'])
    
    # Create matches table
    op.create_table('matches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('uuid_generate_v4()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('applicant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applicants.id'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=False),
        sa.Column('score', sa.Float, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, default='pending'),
        sa.Column('metadata', sa.JSON, nullable=False, default=sa.text("'{}'")),
    )
    op.create_index('ix_matches_company_id', 'matches', ['company_id'])
    
    # Create report_runs table
    op.create_table('report_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('uuid_generate_v4()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('params_json', sa.JSON, nullable=False, default=sa.text("'{}'")),
        sa.Column('status', sa.String(50), nullable=False, default='pending'),
        sa.Column('url', sa.String(500)),
        sa.Column('error_message', sa.String()),
    )
    op.create_index('ix_report_runs_company_id', 'report_runs', ['company_id'])
    op.create_index('ix_report_runs_type', 'report_runs', ['type'])
    
    # Create audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('uuid_generate_v4()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id')),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', postgresql.UUID(as_uuid=True)),
        sa.Column('details', sa.JSON, nullable=False, default=sa.text("'{}'")),
        sa.Column('ip_address', sa.String(45)),
    )
    op.create_index('ix_audit_logs_company_id', 'audit_logs', ['company_id'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
    
    # Create client_configs table
    op.create_table('client_configs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('uuid_generate_v4()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('config_key', sa.String(100), nullable=False),
        sa.Column('config_yaml', sa.String, nullable=False),
        sa.Column('version', sa.Integer, nullable=False, default=1),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
    )
    op.create_index('ix_client_configs_company_id', 'client_configs', ['company_id'])
    op.create_index('ix_client_configs_config_key', 'client_configs', ['config_key'])
    
    # Create RLS helper functions
    op.execute("""
        CREATE OR REPLACE FUNCTION get_current_company_key()
        RETURNS TEXT AS $$
        BEGIN
            RETURN current_setting('request.company_key', true);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    """)
    
    op.execute("""
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
    """)
    
    # Enable RLS on all tenant tables
    tenant_tables = ['users', 'applicants', 'projects', 'matches', 'report_runs', 'audit_logs', 'client_configs']
    
    for table in tenant_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"""
            CREATE POLICY {table}_company_isolation ON {table}
            USING (company_id = get_company_id_from_key(get_current_company_key()))
        """)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('client_configs')
    op.drop_table('audit_logs')
    op.drop_table('report_runs')
    op.drop_table('matches')
    op.drop_table('projects')
    op.drop_table('applicants')
    op.drop_table('users')
    op.drop_table('companies')
    
    # Drop functions
    op.execute("DROP FUNCTION IF EXISTS get_company_id_from_key(TEXT)")
    op.execute("DROP FUNCTION IF EXISTS get_current_company_key()")