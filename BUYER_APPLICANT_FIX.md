# Fix: Buyer Cannot Create Applicants Issue

## Problem Analysis

From the logs, a buyer user is being redirected when trying to add applicants, but no new applicant is created. The issue is:

1. **Role Confusion**: Buyers shouldn't create applicants directly - they create applications
2. **Missing API Calls**: No POST requests to create applicants/applications in the logs
3. **Incorrect Navigation**: Buyer might be redirected to wrong page

## System Design

### Correct Flow:
1. **Staff/Admin** → Can create and manage applicants at `/dashboard/applicants/new`
2. **Buyers** → Create applications (which auto-create applicant profiles) at `/dashboard/buyers/apply/[projectId]`

### Current Issues:
- Buyers might have a button pointing to `/dashboard/applicants/new` (staff-only route)
- Application creation might be failing silently
- Permission errors not being shown to user

## Solution

### 1. Check Buyer Portal for Incorrect Links
The buyer portal should NOT have "Add Applicant" buttons. They should have:
- "Apply to Property" buttons on property cards
- "View My Applications" link

### 2. Fix Application Creation Flow
When a buyer applies to a property:
1. Navigate to `/dashboard/buyers/apply/[projectId]`
2. Fill out application form (creates applicant profile if needed)
3. Submit → Creates application + applicant
4. Redirect to `/dashboard/buyers?tab=applications&success=true`

### 3. Add Error Handling
Show clear error messages if:
- User lacks permissions
- Form validation fails
- API calls fail

## Implementation Steps

### Step 1: Remove Any "Add Applicant" Links from Buyer Portal
```tsx
// In buyer portal components, remove any links like:
<Link href="/dashboard/applicants/new">Add Applicant</Link>

// Replace with proper application flow:
<Link href={`/dashboard/buyers/apply/${property.id}`}>Apply Now</Link>
```

### Step 2: Ensure Application Form Works
The application form at `/dashboard/buyers/apply/[id]` should:
1. Auto-fill user's email
2. Create applicant profile if needed
3. Show clear success/error messages

### Step 3: Add Debug Logging
```tsx
// In createApplication action:
console.log('Creating application for user:', profile.email)
console.log('Form data:', Object.fromEntries(formData))

// Add try-catch with user-friendly errors:
try {
  // ... create application
} catch (error) {
  console.error('Application creation failed:', error)
  return {
    error: 'Failed to submit application. Please try again.'
  }
}
```

### Step 4: Fix Permissions
Ensure buyers can only:
- View their own applications
- Create new applications
- NOT create/edit applicants directly

## Testing

1. Login as buyer@test.com
2. Go to Properties tab
3. Click "Apply Now" on any property
4. Fill form and submit
5. Should redirect to Applications tab with new application

## Expected Behavior

- Buyers apply to properties → Creates application + applicant profile
- Staff create applicants → Direct applicant creation
- Clear error messages if anything fails
- Proper redirects after success