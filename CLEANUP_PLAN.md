# HomeVerse Cleanup Plan

## Overview
This plan outlines the systematic cleanup of the HomeVerse codebase to remove ~40-50% of redundant files and prepare for production deployment.

## Phase 1: Immediate Cleanup (High Priority)

### 1.1 Remove Entire Legacy Backend
```bash
# Delete the entire unused app directory
rm -rf app/
```
**Impact**: Removes ~100+ unused Python files
**Risk**: None - confirmed not in use

### 1.2 Delete Test and Debug Scripts
```bash
# Remove one-off test files
rm test_*.py
rm debug_*.py
rm check_*.py
rm verify_*.py
rm temp_*.py
rm mock_*.py
```
**Files to Remove**:
- All test_*.py files (40+ files)
- All debug_*.py files
- All temporary scripts
- Keep only: test_applications_flow.py, test_application_approval.py (recent, documented)

### 1.3 Clean Migration Scripts
```bash
# Remove old migration files
rm migrate_*.py
rm fix_*.py
rm update_*.py
rm add_*.py
```
**Keep Only**:
- supabase_backend.py (main backend)
- Latest SQL schema files

### 1.4 Remove Duplicate Requirements Files
```bash
rm requirements.txt
rm requirements_simple.txt
rm requirements_postgresql.txt
```
**Keep Only**: requirements_supabase.txt

## Phase 2: Documentation Consolidation

### 2.1 Remove Redundant Docs
**Delete**:
- All STATUS_*.md files
- All ROADMAP_*.md files  
- All duplicate deployment guides
- Old migration guides

**Keep and Update**:
- README.md (main)
- CLAUDE.md (AI instructions)
- ENVIRONMENT_VARIABLES.md
- TEST_LOGINS.md

### 2.2 Create Single Documentation Structure
```
docs/
├── README.md (main project overview)
├── DEPLOYMENT.md (consolidated deployment guide)
├── API.md (API documentation)
├── ARCHITECTURE.md (system design)
└── DEVELOPMENT.md (local setup)
```

## Phase 3: SQL and Database Cleanup

### 3.1 Consolidate SQL Files
**Delete**:
- All fix_*.sql files
- All migration_*.sql files
- Old schema versions

**Create**:
- `schema/current_schema.sql` - Current production schema
- `schema/migrations/` - Future migration directory

### 3.2 Remove SQLite Files
```bash
rm *.db
rm *.db-journal
```

## Phase 4: Frontend Cleanup

### 4.1 Remove Debug Components
- Delete `/dashboard/projects/debug/` page
- Remove any console.log statements
- Clean up commented code

### 4.2 Optimize Imports
- Remove unused imports
- Consolidate duplicate utilities

## Phase 5: Configuration Cleanup

### 5.1 Environment Files
**Keep**:
- `.env.example` (template)
- `.env.local` (gitignored)

**Remove**:
- Multiple .env variants
- Test environment files

### 5.2 Virtual Environments
```bash
rm -rf venv/
rm -rf venv_postgres/
```
Use single virtual environment going forward

## Execution Plan

### Week 1: High-Risk Cleanup
1. Backup entire codebase
2. Remove app/ directory
3. Clean test files
4. Test application functionality

### Week 2: Documentation and SQL
1. Consolidate documentation
2. Clean SQL files
3. Update deployment guides

### Week 3: Final Cleanup
1. Frontend optimization
2. Configuration cleanup
3. Final testing

## Validation Checklist

After each phase:
- [ ] Application builds successfully
- [ ] All features work as expected
- [ ] No broken imports
- [ ] Tests pass (when implemented)
- [ ] Deployment succeeds

## Expected Results

### Before Cleanup:
- ~500+ files
- ~200+ Python files
- 50+ documentation files
- 40+ SQL files

### After Cleanup:
- ~200 files (60% reduction)
- ~20 Python files
- 10 documentation files
- 5 SQL files

## Safety Measures

1. **Full Backup**: Create complete backup before starting
2. **Git Branch**: Work in cleanup branch first
3. **Incremental**: Test after each major deletion
4. **Documentation**: Update CLAUDE.md with changes

## Post-Cleanup Structure

```
homeverse/
├── frontend/              # Next.js app
├── supabase_backend.py   # Main backend
├── requirements_supabase.txt
├── docs/                 # Consolidated docs
├── schema/               # Database schema
├── .env.example
├── render.yaml
└── README.md
```

This cleanup will reduce complexity, improve maintainability, and prepare the codebase for production scaling.