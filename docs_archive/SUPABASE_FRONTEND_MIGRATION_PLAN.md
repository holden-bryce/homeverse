# 🚀 Complete Supabase Frontend Migration Plan

## Current Issues
- Frontend still has mixed usage of old API client and Supabase
- Some components reference old hooks and stores
- Inconsistent authentication patterns
- Build failures due to missing dependencies

## 📋 Systematic Migration Plan

### Phase 1: Core Infrastructure (CRITICAL)
1. **Replace API Client** (`/lib/api/client.ts`)
   - Create new Supabase-based API client
   - Replace all HTTP calls with Supabase calls
   - Update authentication handling

2. **Update React Query Hooks** (`/lib/api/hooks.ts`)
   - Replace all hooks with Supabase equivalents
   - Update data fetching patterns
   - Ensure proper error handling

3. **Update Auth Store** (`/lib/stores/auth.ts`)
   - Replace Zustand auth store with Supabase auth
   - Remove redundant user state management
   - Use Supabase session as single source of truth

### Phase 2: Dashboard Components (HIGH PRIORITY)
1. **Applicant Management Pages**
   - `/dashboard/applicants/page.tsx` - List view
   - `/dashboard/applicants/[id]/page.tsx` - Detail view
   - `/dashboard/applicants/[id]/edit/page.tsx` - Edit form
   - `/dashboard/applicants/new/page.tsx` - Create form

2. **Project Management Pages**
   - `/dashboard/projects/page.tsx` - List view
   - `/dashboard/projects/[id]/page.tsx` - Detail view
   - `/dashboard/projects/[id]/edit/page.tsx` - Edit form
   - `/dashboard/projects/new/page.tsx` - Create form

3. **Dashboard Pages**
   - All role-specific dashboards
   - Analytics and reporting components
   - Settings pages

### Phase 3: Forms and Data Input (MEDIUM)
1. **Contact Forms**
   - Update contact form submission to use Supabase
   - Replace SendGrid integration with Supabase Edge Functions

2. **File Uploads**
   - Update to use Supabase Storage
   - Replace old file handling

### Phase 4: Real-time Features (LOW)
1. **Add Real-time Subscriptions**
   - Live updates for applicants
   - Real-time project changes
   - Activity feeds

## 🔧 Implementation Strategy

### Step 1: Create New Supabase Hooks
```typescript
// /lib/supabase/hooks.ts
export const useApplicants = () => {
  return useQuery({
    queryKey: ['applicants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
      if (error) throw error
      return data
    }
  })
}

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
      if (error) throw error
      return data
    }
  })
}
```

### Step 2: Replace Old API Calls Systematically
```typescript
// BEFORE (old API client):
const response = await apiClient.getApplicants()

// AFTER (Supabase):
const { data, error } = await supabase
  .from('applicants')
  .select('*')
```

### Step 3: Update All Form Submissions
```typescript
// BEFORE:
await apiClient.createApplicant(data)

// AFTER:
const { data: newApplicant, error } = await supabase
  .from('applicants')
  .insert(applicantData)
  .single()
```

## 📁 Files That Need Updates

### Critical Files:
1. `/lib/api/client.ts` - Replace entirely
2. `/lib/api/hooks.ts` - Replace with Supabase hooks
3. `/lib/stores/auth.ts` - Simplify to use Supabase auth
4. `/providers/auth-provider.tsx` - Remove (already replaced)

### Dashboard Pages:
1. `/app/dashboard/applicants/page.tsx`
2. `/app/dashboard/projects/page.tsx`
3. `/app/dashboard/lenders/page.tsx`
4. `/app/dashboard/developers/page.tsx`
5. `/app/dashboard/buyers/page.tsx`

### Forms:
1. All forms in `/components/forms/`
2. Contact form submissions
3. Settings pages

## 🚀 Quick Fix Implementation

Let me create the essential files right now to get everything working:

### 1. New Supabase Hooks
### 2. Updated API Client
### 3. Fixed Dashboard Components

This will ensure consistent Supabase usage across the entire application.

## Timeline
- **Immediate (1 hour)**: Fix critical build errors and create new hooks
- **Phase 1 (2 hours)**: Replace core infrastructure
- **Phase 2 (4 hours)**: Update all dashboard components
- **Phase 3 (2 hours)**: Fix forms and data input
- **Phase 4 (1 hour)**: Add real-time features

## Success Criteria
✅ All API calls use Supabase
✅ No references to old API client
✅ All forms submit to Supabase
✅ Real-time updates working
✅ Authentication fully integrated
✅ Build passes without errors
✅ All functionality works end-to-end