# HomeVerse Codebase Cleanup & Refactoring Plan

## Current State Assessment

### 🔴 Issues to Address

1. **Monolithic Backend File**
   - `simple_backend.py` is 6300+ lines
   - Contains all models, endpoints, and business logic in one file
   - Difficult to maintain and extend

2. **Duplicate/Legacy Code**
   - `app/` directory contains unused modular architecture
   - Multiple database initialization scripts
   - Various test and monitoring scripts scattered around

3. **Inconsistent Documentation**
   - Multiple status files with overlapping information
   - Outdated deployment guides
   - Missing clear architecture documentation

4. **Mixed Database Strategies**
   - SQLite for local development
   - PostgreSQL for production
   - Schema mismatches between environments

## Cleanup Plan

### Phase 1: Documentation Consolidation (Week 1)

1. **Create Single Source of Truth**
   ```
   docs/
   ├── README.md                 # Main project overview
   ├── ARCHITECTURE.md          # System architecture
   ├── DEPLOYMENT.md            # Deployment guide
   ├── DEVELOPMENT.md           # Local development setup
   ├── API.md                   # API documentation
   └── TROUBLESHOOTING.md       # Common issues & solutions
   ```

2. **Remove/Archive Old Docs**
   - Move all STATUS_*.md files to `docs/archive/`
   - Consolidate deployment guides
   - Update CLAUDE.md with current architecture

### Phase 2: Code Organization (Week 2-3)

1. **Refactor Backend Structure**
   ```
   backend/
   ├── main.py                  # FastAPI app initialization
   ├── config.py                # Configuration management
   ├── database.py              # Database connection
   ├── models/
   │   ├── __init__.py
   │   ├── user.py
   │   ├── company.py
   │   ├── project.py
   │   └── applicant.py
   ├── api/
   │   ├── __init__.py
   │   ├── auth.py
   │   ├── users.py
   │   ├── projects.py
   │   ├── applicants.py
   │   └── admin.py
   ├── services/
   │   ├── __init__.py
   │   ├── auth_service.py
   │   ├── email_service.py
   │   └── matching_service.py
   └── utils/
       ├── __init__.py
       ├── security.py
       └── validators.py
   ```

2. **Clean Root Directory**
   ```
   homeverse/
   ├── backend/                 # All backend code
   ├── frontend/                # Next.js app (already organized)
   ├── scripts/                 # Utility scripts
   │   ├── init_db.py
   │   └── deploy.sh
   ├── docs/                    # All documentation
   ├── tests/                   # All tests
   ├── .github/                 # GitHub workflows
   ├── docker-compose.yml       # Local development
   ├── render.yaml              # Render deployment
   ├── requirements.txt         # Python dependencies
   └── README.md                # Project overview
   ```

### Phase 3: Database Standardization (Week 4)

1. **Unified Schema Management**
   - Create Alembic migrations for schema versioning
   - Ensure PostgreSQL and SQLite schemas match
   - Single source of truth for schema

2. **Environment-Specific Configs**
   ```
   backend/config/
   ├── base.py                  # Base configuration
   ├── development.py           # Local dev (SQLite)
   ├── production.py            # Production (PostgreSQL)
   └── testing.py               # Test configuration
   ```

### Phase 4: Testing & CI/CD (Week 5)

1. **Comprehensive Test Suite**
   ```
   tests/
   ├── unit/
   │   ├── test_auth.py
   │   ├── test_models.py
   │   └── test_services.py
   ├── integration/
   │   ├── test_api.py
   │   └── test_database.py
   └── e2e/
       └── test_workflows.py
   ```

2. **CI/CD Pipeline**
   - GitHub Actions for testing
   - Automated deployment to Render
   - Database migration automation

## Migration Strategy

### Step 1: Create New Structure (Don't Break Existing)
1. Create new `backend/` directory
2. Copy and refactor code module by module
3. Test each module thoroughly
4. Keep `simple_backend.py` running until migration complete

### Step 2: Gradual Migration
1. Start with models and database
2. Move authentication endpoints
3. Migrate remaining endpoints
4. Update imports and dependencies

### Step 3: Switch Over
1. Update `render.yaml` to use new structure
2. Deploy and test thoroughly
3. Archive old code

### Step 4: Documentation Update
1. Update all docs to reflect new structure
2. Create migration guide for developers
3. Update CLAUDE.md for AI assistants

## Benefits After Cleanup

1. **Maintainability**
   - Easier to find and fix bugs
   - Clear separation of concerns
   - Better code reusability

2. **Scalability**
   - Easy to add new features
   - Better performance optimization
   - Cleaner dependency management

3. **Developer Experience**
   - Clear project structure
   - Better documentation
   - Easier onboarding

4. **Testing**
   - Isolated components easier to test
   - Better test coverage
   - Faster CI/CD pipeline

## Timeline

- **Week 1**: Documentation consolidation
- **Week 2-3**: Backend refactoring
- **Week 4**: Database standardization
- **Week 5**: Testing and CI/CD
- **Week 6**: Final migration and cleanup

## Priority Order

1. **Fix Authentication** (Immediate)
2. **Update Critical Docs** (Day 1-2)
3. **Begin Backend Refactor** (Week 1)
4. **Complete Migration** (Week 2-4)
5. **Polish & Optimize** (Week 5-6)