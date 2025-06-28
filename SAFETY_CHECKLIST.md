# Safety Checklist for Cleanup

## Pre-Cleanup Verification

### ✅ Branch Protection
- [x] Created new branch: `cleanup-and-beta-prep`
- [ ] All changes will be tested before merging to main

### ✅ Directory Verification
- [x] Confirmed `/app/` is unused backend code (NOT frontend's `/frontend/src/app/`)
- [x] Verified `supabase_backend.py` has no imports from `/app/`
- [x] Frontend's `/frontend/src/app/` is the active Next.js app directory

### 🔍 Functionality Tests Before Each Phase

#### Before removing `/app/` directory:
- [ ] Test login for all 5 user types
- [ ] Test project creation
- [ ] Test application submission
- [ ] Test application approval/rejection
- [ ] Test email notifications

#### Before removing test scripts:
- [ ] Identify which test scripts are referenced in docs
- [ ] Keep only documented test scripts
- [ ] Verify no imports from scripts to be deleted

#### Before removing SQL files:
- [ ] Backup current database schema
- [ ] Document current schema version
- [ ] Keep only the latest working schema

## Safe Removal Order

### Phase 1: Large Unused Directories
1. `/app/` - Verified unused backend module
2. `/venv_postgres/` - Old virtual environment
3. `/pitchdeck/` - Presentation files (backup first)

### Phase 2: Test Scripts (After Verification)
Keep these recent, documented scripts:
- `test_applications_flow.py`
- `test_application_approval.py`
- `test_contact_api.py`
- `test_project_navigation.py`
- `test_project_view.py`

Remove all others after verifying no dependencies.

### Phase 3: SQL Migration Files
Keep only:
- Current production schema
- Latest RLS policies
- Essential seed data

## Testing Protocol

After EACH removal:
1. Run backend: `python supabase_backend.py`
2. Run frontend: `cd frontend && npm run dev`
3. Test core workflows:
   - Login
   - View projects
   - Submit application
   - Approve/reject application
   - Check email delivery

## Rollback Plan

If anything breaks:
```bash
# Discard all changes and return to main
git checkout main
git branch -D cleanup-and-beta-prep
```

## Current Working Features to Preserve

1. **Authentication**: All 5 user types can login
2. **Projects**: CRUD operations working
3. **Applications**: Submit, view, approve/reject working
4. **Emails**: SendGrid integration working
5. **Multi-tenant**: Company isolation working
6. **UI**: All dashboards and components working

## DO NOT REMOVE

1. `/frontend/src/app/` - This is the Next.js app directory
2. `supabase_backend.py` - Main backend
3. `requirements_supabase.txt` - Current dependencies
4. `.env` files currently in use
5. `render.yaml` - Deployment config
6. Recent fix files that are documented

---

This checklist ensures we maintain all functionality while cleaning up technical debt.