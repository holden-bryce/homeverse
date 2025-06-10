# 🔐 Row Level Security (RLS) Implementation Plan for HomeVerse

## 📋 Overview
This document outlines the plan to re-enable Row Level Security (RLS) before public launch. RLS is currently disabled for development but MUST be re-enabled for production security.

## 🚨 Current Status
- **RLS Status**: DISABLED (Development Mode)
- **Risk Level**: HIGH if deployed to production
- **Timeline**: Must be enabled before public launch

## 🎯 Why RLS is Critical

### 1. **Multi-Tenant Data Isolation**
- Prevents Company A from seeing Company B's data
- Ensures applicants' sensitive information is protected
- Maintains privacy between different organizations

### 2. **Compliance Requirements**
- Fair Housing Act compliance
- GDPR/CCPA data protection requirements
- SOC 2 compliance for enterprise customers

### 3. **Security Best Practices**
- Database-level security that cannot be bypassed
- Protection against API vulnerabilities
- Defense in depth approach

## 📊 RLS Implementation Strategy

### Phase 1: Pre-Implementation (Before Enabling RLS)
1. **Audit Data Model**
   - Ensure all tables have `company_id` column
   - Verify foreign key relationships
   - Add indexes for performance

2. **Test User System**
   - Create test companies with isolated data
   - Set up test users for each role
   - Document expected access patterns

3. **API Preparation**
   - Ensure all queries include company context
   - Add company_id validation in backend
   - Update API endpoints to handle RLS errors

### Phase 2: RLS Implementation

#### Step 1: Create Helper Functions
```sql
-- Avoid recursion with SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION auth.user_company_id() 
RETURNS UUID AS $$
  SELECT company_id 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.user_role() 
RETURNS TEXT AS $$
  SELECT role 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

#### Step 2: Enable RLS on Tables (Order Matters!)
```sql
-- 1. Companies table first (no dependencies)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 2. Profiles table (depends on companies)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Other tables
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
```

#### Step 3: Apply Policies by Table

**Companies Table**
- Users can only see their own company
- Only admins can update company settings

**Profiles Table**
- Users can see their own profile
- Users can see other profiles in their company
- Users can only update their own profile

**Applicants Table**
- Full CRUD within same company
- No cross-company access

**Projects Table**
- Public read access (for discovery)
- Create/Update/Delete restricted by company and role

**Activities Table**
- Read access within company
- System creates via triggers

**Contact Submissions**
- Public can create
- Only admins can read

**Matches Table**
- Read if applicant or project belongs to company
- Only system can create/update

### Phase 3: Testing Strategy

#### 1. Unit Tests
```python
def test_company_isolation():
    # User from Company A
    user_a = login("user@companya.com")
    applicants_a = get_applicants(user_a)
    
    # User from Company B
    user_b = login("user@companyb.com")
    applicants_b = get_applicants(user_b)
    
    # Verify no overlap
    assert len(set(applicants_a) & set(applicants_b)) == 0
```

#### 2. Role-Based Tests
- Admin: Full access within company
- Developer: Can manage projects
- Lender: Read-only access to most data
- Buyer: Limited to own applications
- Applicant: Only own data

#### 3. Performance Tests
- Query performance with RLS enabled
- Bulk operations
- Complex joins

### Phase 4: Rollout Plan

#### Week 1: Development Environment
1. Enable RLS in dev Supabase project
2. Run full test suite
3. Fix any issues
4. Document any API changes needed

#### Week 2: Staging Environment
1. Clone production data to staging
2. Enable RLS policies
3. Full regression testing
4. Performance benchmarking

#### Week 3: Production Rollout
1. Schedule maintenance window
2. Backup database
3. Enable RLS policies
4. Run smoke tests
5. Monitor for errors

## 🛡️ Security Checklist Before Launch

### Database Security
- [ ] Enable RLS on all tables
- [ ] Apply all security policies
- [ ] Remove any debug permissions
- [ ] Audit service role usage
- [ ] Enable query logging

### API Security
- [ ] Validate company context on all requests
- [ ] Handle RLS errors gracefully
- [ ] Add rate limiting
- [ ] Implement request signing
- [ ] Enable API audit logs

### Frontend Security
- [ ] Never expose service role key
- [ ] Validate data before display
- [ ] Implement proper error handling
- [ ] Add user activity monitoring
- [ ] Enable CSP headers

## 🚨 Emergency Procedures

### If RLS Causes Issues in Production:
1. **Immediate Response**
   ```sql
   -- Temporarily disable specific policy
   DROP POLICY "problematic_policy" ON table_name;
   ```

2. **Quick Fix**
   ```sql
   -- Add temporary permissive policy
   CREATE POLICY "temp_allow" ON table_name
   FOR ALL USING (true)
   WITH CHECK (company_id = auth.user_company_id());
   ```

3. **Rollback Plan**
   - Have pre-written SQL to disable RLS
   - Document which policies can be safely disabled
   - Test rollback procedures

## 📅 Timeline

### 2 Weeks Before Launch
- [ ] Complete RLS implementation in staging
- [ ] Run security audit
- [ ] Performance testing complete
- [ ] Documentation updated

### 1 Week Before Launch
- [ ] Final testing in production-like environment
- [ ] Team training on RLS
- [ ] Emergency procedures documented
- [ ] Monitoring alerts configured

### Launch Day
- [ ] Enable RLS in production
- [ ] Monitor all systems
- [ ] Have rollback ready
- [ ] 24/7 on-call coverage

## 🔍 Monitoring & Alerts

Set up alerts for:
- RLS policy violations
- Unusual data access patterns
- Performance degradation
- Failed queries due to RLS

## 📚 Resources

1. [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
2. [PostgreSQL RLS Best Practices](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
3. [Multi-Tenant Security Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/security)

## ⚠️ Remember

**RLS is not optional for production!** It's our primary defense against data breaches and compliance violations. The temporary disabling is ONLY for development speed and must be reversed before any public or customer access.