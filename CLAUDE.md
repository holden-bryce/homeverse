# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Prerequisites
```bash
# On Ubuntu/Debian systems, install required packages:
sudo apt update
sudo apt install python3.12-venv python3-pip postgresql-client redis-tools

# Create and activate virtual environment:
python3 -m venv venv
source venv/bin/activate
```

### Local Development

#### ✅ Current Working Setup (Simplified Backend)
```bash
# Start backend (simplified for development)
python3 simple_backend.py                    # Runs on http://localhost:8000

# Start frontend (separate terminal)
cd frontend && npm run dev                    # Runs on http://localhost:3000

# Test authentication
# Use any credentials from TEST_LOGINS.md
```

#### Full Production Setup (When Ready)
```bash
# First time setup:
source venv/bin/activate     # Activate virtual environment
make install                 # Install dependencies

# Daily development:
source venv/bin/activate     # Always activate venv first
make dev                     # Start API server (http://localhost:8000)
make worker                  # Start Celery worker (separate terminal)
make beat                    # Start Celery scheduler (separate terminal)
make flower                  # Start Celery monitoring (http://localhost:5555)
```

### Docker Development
```bash
make docker-up       # Start all services (API, worker, beat, postgres, redis)
make docker-down     # Stop all services
make docker-logs     # View logs
make docker-test     # Run tests in Docker
```

### Testing
```bash
make test            # Run all tests
make test-unit       # Run unit tests only
make test-integration # Run integration tests only
make test-cov        # Run tests with coverage report
```

### Code Quality
```bash
make lint            # Ruff linting
make lint-fix        # Fix linting issues automatically
make format          # Black code formatting
make type-check      # MyPy type checking
make qa              # Run lint + type-check + test
```

### Database Management
```bash
make db-upgrade      # Apply migrations
make db-downgrade    # Rollback one migration
make db-migration MSG="description" # Generate new migration
make db-reset        # Reset database (WARNING: destroys data)
```

## Architecture Overview

### Multi-Tenant Design
- **Row-Level Security (RLS)**: All data is isolated by `company_id` at the database level
- **Company Key Header**: All API requests must include `x-company-key` header
- **Middleware**: `CompanyKeyMiddleware` enforces tenant isolation
- **Context Setting**: `set_rls_context()` sets PostgreSQL session variables for RLS

### Core Components

**FastAPI Application** (`app/main.py`)
- Main entry point with middleware setup
- Router registration for API v1 endpoints
- Global exception handling and health checks

**Database Layer** (`app/db/`)
- `models.py`: SQLModel classes with multi-tenant support
- `crud.py`: Database operations with RLS enforcement
- `tenant_context.py`: Multi-tenant middleware and context management
- `database.py`: Database connection and session management

**API Layer** (`app/api/v1/`)
- Modular routers: auth, applicants, projects, lenders, reports, admin
- JWT authentication with company-based access control
- Pydantic models for request/response validation

**Services Layer** (`app/services/`)
- `matching.py`: AI-powered applicant-project matching using OpenAI embeddings
- `cra.py`: Community Reinvestment Act compliance reporting
- `heatmap.py`: Geospatial analytics and visualization
- `doc_ingest.py`: Document processing with Unstructured.io
- `notif.py`: Real-time notifications

**Background Workers** (`app/workers/`)
- Celery-based async processing
- Task queues: reports, analytics, documents, notifications
- Scheduled tasks for nightly stats refresh and cleanup

### Key Technologies
- **Database**: PostgreSQL 15+ with PostGIS extension for geospatial data
- **Cache/Queue**: Redis for Celery broker and caching
- **AI/ML**: OpenAI embeddings for semantic matching
- **Authentication**: JWT tokens with optional Supabase/Clerk integration
- **Async**: Full async/await with SQLModel and AsyncPG

## Development Patterns

### Adding New API Endpoints
1. Define Pydantic models in the appropriate router file
2. Add SQLModel database model in `app/db/models.py` with `company_id` field
3. Create CRUD operations in `app/db/crud.py` with RLS support
4. Implement router endpoints with proper authentication decorators
5. Add comprehensive tests in `app/tests/`

### Multi-Tenant Considerations
- **Always include `company_id`** in database models for RLS
- **Use `with_company_key` decorator** for functions requiring tenant context
- **Test with multiple tenants** to ensure proper data isolation
- **Set RLS context** in database sessions using `set_rls_context()`

### Background Tasks
- Add new Celery tasks in `app/workers/tasks.py`
- Configure task routing in `app/workers/celery_app.py`
- Use appropriate queues: reports, analytics, documents, notifications
- Handle errors gracefully with retries and dead letter queues

### Testing Strategy
- **Unit tests**: Test individual functions/classes in isolation
- **Integration tests**: Test API endpoints with real database
- **Fixtures**: Use pytest fixtures for test data setup
- **Multi-tenant testing**: Verify data isolation between companies
- **Database setup**: Tests use separate test database with auto-cleanup

### Geospatial Data
- **Storage**: Use PostGIS `Geography` type for lat/lon coordinates
- **Format**: Store as WKT strings, convert to/from lat/lon tuples in code
- **Queries**: Use PostGIS functions for distance calculations and bounds queries
- **SRID**: Always use SRID 4326 (WGS84) for consistency

### Error Handling
- **Global handler**: Catches unhandled exceptions in `app/main.py`
- **Structured logging**: Use `app/utils/logging.py` for consistent log format
- **HTTP exceptions**: Raise FastAPI HTTPException for API errors
- **Validation**: Rely on Pydantic for request validation

## Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `TEST_DATABASE_URL`: Test database connection string
- `REDIS_URL`: Redis connection string (required)
- `JWT_SECRET_KEY`: JWT signing secret (required)
- `OPENAI_API_KEY`: OpenAI API key for embeddings (required)
- `SENDGRID_API_KEY`: Email notifications (optional)
- `UNSTRUCTURED_API_KEY`: Document processing (optional)

### Company Provisioning
- Companies are auto-created when using new `company_key`
- Default to "trial" plan with 5 seats
- Override in `app/db/tenant_context.py:ensure_company_exists()`

## Database Schema Notes

### Key Models
- `Company`: Tenant root with key, name, plan, settings
- `User`: Company-scoped users with role-based access
- `Applicant`: Housing seekers with geospatial data and preferences
- `Project`: Development projects with location and AMI requirements
- `Match`: AI-generated applicant-project scoring
- `ReportRun`: Async report generation tracking
- `AuditLog`: Compliance audit trail

### RLS Policies
Database uses PostgreSQL Row Level Security policies based on:
```sql
current_setting('request.company_key')
```
Set via `set_rls_context()` in application code.

## 🎉 Current Status: Fully Functional Application

### ✅ Complete Feature Set
- **Multi-role authentication system** with 5 different user types
- **Automatic role-based dashboard routing** after login
- **Full CORS support** for cross-origin requests
- **JWT token management** with cookie + localStorage storage
- **Protected routes** with middleware authentication
- **Multi-tenant company isolation** working correctly
- **Complete teal branding** throughout entire UI
- **New HomeVerse logo** integrated across all pages and components
- **Working dashboards** with functional features:
  - Lender Portal: Investments, Analytics, Reports, CRA Compliance
  - Developer Portal: Projects, Matching, Analytics
  - Buyer Portal: Project discovery, Applications
  - Interactive Heatmaps with Mapbox integration
  - Real-time charts and data visualizations

### 🔐 Ready-to-Use Test Accounts
All test accounts are pre-created and verified working:
- `developer@test.com` / `password123` → Developer Portal
- `lender@test.com` / `password123` → Lender Portal  
- `buyer@test.com` / `password123` → Buyer Portal
- `applicant@test.com` / `password123` → Applicant Portal
- `admin@test.com` / `password123` → Admin Portal

### 🚀 Quick Start for Development
```bash
# Terminal 1: Start backend
python3 simple_backend.py                    # Runs on http://localhost:8000

# Terminal 2: Start frontend  
cd frontend && npm run dev                    # Runs on http://localhost:3000

# Open browser: http://localhost:3000
# Use any test credentials above
```

### 🎨 UI/UX Features
- **Responsive design** with Tailwind CSS
- **Teal color scheme** replacing all blue references
- **Large, prominent logos** in navigation and headers
- **Professional gradients** and backdrop blur effects
- **Interactive components** with hover states and animations
- **Consistent branding** from landing page to all portals

**Status**: 🟢 **Production-Ready Application**

See `TEST_LOGINS.md` for complete testing documentation.

## Memories
- to memorize