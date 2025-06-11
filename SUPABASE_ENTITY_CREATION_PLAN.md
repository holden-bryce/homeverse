# Supabase Entity Creation Implementation Plan

## 🎯 Objective
Ensure all users can create entities (applicants, projects, etc.) in Supabase with proper multi-tenant isolation and data integrity.

## 🔍 Current Issues Identified

1. **Profile Creation Gap**: Users created through auth don't automatically get a `company_id`
2. **RLS Policy Failures**: Entities can't be created without valid `company_id` in profile
3. **Frontend Workarounds**: Frontend tries to handle missing company assignment (not ideal)
4. **Inconsistent Registration**: Different registration paths lead to different profile states

## 📋 Implementation Steps

### Step 1: Database Schema Fixes ✅
**File**: `fix_supabase_entity_creation.sql`

- Create default company for unassigned users
- Update `handle_new_user()` trigger to assign default company
- Fix existing profiles without company_id
- Create helper functions for RLS policies
- Update all RLS policies to use helper functions
- Add proper indexes for performance

**To Apply**:
```bash
# In Supabase SQL Editor or via CLI
psql <DATABASE_URL> -f fix_supabase_entity_creation.sql
```

### Step 2: Backend Validation Enhancement 🔄
**File**: `supabase_backend.py` (modifications needed)

1. **Enhanced `get_current_user` function**:
   - Auto-create profile if missing
   - Ensure company_id is always present
   - Return complete user context

2. **Add Profile Completion Endpoint**:
   ```python
   @app.post("/api/v1/users/complete-profile")
   ```
   - Assigns default company to users without one
   - Returns updated profile

3. **Add Validation Decorator**:
   ```python
   @require_complete_profile
   ```
   - Apply to all entity creation endpoints
   - Ensures profile is complete before operations

### Step 3: Testing & Verification 📊
**File**: `test_supabase_entity_creation.py`

Tests to run:
1. Login with each user role
2. Profile completion check
3. Create applicants (all roles)
4. Create projects (developer/admin only)
5. Verify company isolation

### Step 4: Frontend Updates (Optional) 🎨
- Remove workaround code in `frontend/src/lib/api/hooks.ts`
- Add profile completion check on login
- Show profile completion prompt if needed

## 🚀 Quick Start Commands

```bash
# 1. Apply database fixes
psql $DATABASE_URL -f fix_supabase_entity_creation.sql

# 2. Run validation patch generator
python3 fix_supabase_backend_validation.py

# 3. Apply the patches to supabase_backend.py manually

# 4. Restart backend
python3 supabase_backend.py

# 5. Run tests
python3 test_supabase_entity_creation.py
```

## 🔐 Security Considerations

1. **Default Company Assignment**: 
   - Safe for MVP/demo
   - Consider company invitation flow for production

2. **RLS Policies**: 
   - Enforced at database level
   - Users can only see/modify their company's data

3. **Role-Based Access**: 
   - Projects creation limited to developers/admins
   - All roles can create applicants

## 📊 Expected Outcomes

After implementation:
- ✅ All authenticated users can create entities
- ✅ Proper multi-tenant isolation maintained
- ✅ No frontend workarounds needed
- ✅ Consistent user experience across all roles
- ✅ Database integrity maintained

## 🐛 Troubleshooting

### Issue: "Profile incomplete" error
**Solution**: Call `/api/v1/users/complete-profile` endpoint

### Issue: RLS policy violations
**Solution**: Check profile has company_id, run profile fix script

### Issue: Cannot create projects as developer
**Solution**: Verify user role is 'developer' or 'admin' in profiles table

## 📝 Notes

- The default company approach is suitable for MVP/demo
- For production, implement proper company invitation system
- Consider adding company management UI for admins
- Monitor for orphaned profiles without company assignment