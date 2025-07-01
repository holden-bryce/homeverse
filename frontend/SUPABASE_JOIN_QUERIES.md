# Supabase Join Queries in Frontend Codebase

## Summary of Join Query Patterns Found

### 1. **Applications with Projects Join** (`/src/app/dashboard/applications/actions.ts`)
```typescript
// Line 153-156
.select(`
  project_id,
  projects!inner(company_id)
`)
```
**Type Assertion Issue**: Uses `as unknown as` pattern for type safety:
```typescript
const appWithProject = application as unknown as { 
  project_id: string, 
  projects: { company_id: string } 
}
```

### 2. **Profiles with Companies Join** (Multiple files)
Pattern: `.select('*, companies(*)')`

Found in:
- `/src/providers/supabase-auth-provider.tsx` (lines 129, 217, 228)
- `/src/providers/supabase-auth-provider.backup.tsx` (lines 118, 199, 210)
- `/src/lib/supabase.ts` (line 65)
- `/src/lib/supabase/hooks.ts` (lines 54, 448)
- `/src/lib/supabase/client.ts` (line 112)

### 3. **Projects with Companies Join** (Multiple files)
Pattern: `.select('*, companies(name)')`

Found in:
- `/src/lib/supabase/hooks.ts` (lines 244, 259)
- `/src/lib/supabase/client.ts` (lines 64, 74)
- `/src/app/dashboard/projects/[id]/page.tsx` (line 38)
- `/src/app/dashboard/buyers/apply/[id]/page.tsx` (line 30)
- `/src/app/dashboard/projects/[id]/edit/page.tsx` (line 17)
- `/src/app/dashboard/lenders/investments/new/page.tsx` (line 70)

### 4. **Activities with Profiles Join** (Multiple files)
Pattern: `.select('*, profiles(full_name)')`

Found in:
- `/src/components/ui/activity-modal.tsx` (line 39)
- `/src/lib/supabase/hooks.ts` (line 487)
- `/src/lib/supabase/client.ts` (line 129)

## Common Issues and Patterns

### 1. **Type Assertions**
Most joined queries use `any` type or require type assertions:
- Components often receive data as `project: any` or `profile: any`
- The applications/actions.ts file shows the most explicit type assertion pattern

### 2. **Nested Data Access**
Join queries create nested objects that TypeScript can't automatically infer:
- `project.companies.name` (from `companies(name)` join)
- `profile.companies` (from `companies(*)` join)
- `activity.profiles.full_name` (from `profiles(full_name)` join)

### 3. **Missing Type Definitions**
The `/src/types/database.ts` file defines basic table types but doesn't include:
- Join query result types
- Nested relationship types
- Type helpers for common join patterns

## Recommendations

1. **Create Type Helpers**: Define types for common join patterns
2. **Use Supabase Type Generation**: Generate types that include relationships
3. **Consistent Type Assertions**: Use a standard pattern across all files
4. **Type Safety Utils**: Create utility functions that return properly typed data

## Files Requiring Type Updates

Priority files with type assertion issues:
1. `/src/app/dashboard/applications/actions.ts` (explicit type assertion pattern)
2. `/src/providers/supabase-auth-provider.tsx` (profile with companies)
3. `/src/lib/supabase/hooks.ts` (multiple join patterns)
4. `/src/lib/supabase/client.ts` (shared client functions)
5. All project detail pages using `companies(name)` joins