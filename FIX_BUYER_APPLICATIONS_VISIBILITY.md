# Fix: Buyer Applications Not Showing

## Problem
1. Buyers could create applications but they wouldn't show up in their portal
2. The system was filtering applications by matching `applicants.email` to the logged-in user's email
3. If a buyer entered a different email in the form, the application wouldn't be visible

## Root Cause
The backend and frontend had a mismatch in how they handle buyer applications:
- Backend treats buyers and applicants as separate entities
- Frontend was trying to filter by email match between applicant and user
- The email field in the application form was editable, allowing mismatches

## Solution

### 1. Fixed Application Form Email Field
Made the email field readonly and auto-populated with the user's email:
```tsx
// Before
<Input
  defaultValue={userProfile.email}
  disabled={isSubmitting}
/>

// After  
<Input
  value={userProfile.email}
  readOnly
  className="rounded-lg border-sage-200 bg-gray-50"
  disabled={isSubmitting}
/>
```

### 2. Updated useApplications Hook
Changed the filtering logic to:
1. First filter by company_id (all applications in the company)
2. Then for buyers, find all applicants with matching email
3. Filter applications by those applicant IDs

```tsx
// For buyers, filter by user email (in the applicants joined table)
if (filters?.email || (profile?.role === 'buyer' && user?.email)) {
  const emailToFilter = filters?.email || user.email
  // Find all applicants with this email
  const { data: applicantIds } = await supabase
    .from('applicants')
    .select('id')
    .eq('email', emailToFilter)
  
  if (applicantIds && applicantIds.length > 0) {
    const ids = applicantIds.map(a => a.id)
    query = query.in('applicant_id', ids)
  }
}
```

## Testing
1. Login as buyer@test.com
2. Apply to a property
3. Check Applications tab - should now show the application
4. The email field should be readonly with the buyer's email

## Notes
- The developer portal should continue to work as it filters by company_id
- Multiple applicant records with the same email are handled correctly
- The fix maintains backward compatibility with existing data