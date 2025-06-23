# Server Actions Summary

All entity creation and updates now use direct Supabase client calls (matching the working applicant pattern).

## ✅ Updated to Server Actions

### 1. **Projects** (`/dashboard/projects/actions.ts`)
- `createProject()` - Creates project with company assignment
- `updateProject()` - Updates existing project
- `deleteProject()` - Deletes project

### 2. **Applicants** (`/dashboard/applicants/actions.ts`) 
- `createApplicant()` - Already working pattern
- `updateApplicant()` - Updates applicant
- `deleteApplicant()` - Deletes applicant

### 3. **Applications** (`/dashboard/applications/actions.ts`) - NEW
- `submitApplication()` - Submit housing application
- `updateApplicationStatus()` - Update status (admin/developer only)

### 4. **Investments** (`/dashboard/lenders/actions.ts`) - NEW
- `createInvestment()` - Create new investment
- `updateInvestment()` - Update investment details

### 5. **Settings** (`/dashboard/settings/actions.ts`) - NEW
- `updateUserProfile()` - Update user profile
- `updateCompanySettings()` - Update company info (admin only)
- `updateNotificationPreferences()` - Update notifications
- `enableTwoFactor()` - Enable 2FA

### 6. **Buyer Preferences** (`/dashboard/buyers/actions.ts`) - NEW
- `saveBuyerPreferences()` - Save buyer search preferences
- `getBuyerPreferences()` - Get saved preferences

### 7. **Contact** (`/contact/actions.ts`)
- `submitContactForm()` - Already using Supabase

## 🔧 Pattern Used

All actions follow this consistent pattern:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEntity(formData: FormData) {
  try {
    // 1. Get user profile
    const profile = await getUserProfile()
    if (!profile) {
      throw new Error('Unauthorized')
    }
    
    // 2. Create Supabase client
    const supabase = createClient()
    
    // 3. Ensure company exists
    let companyId = profile.company_id
    if (!companyId) {
      // Create default company logic
    }
    
    // 4. Prepare data
    const entityData = {
      // ... parse formData
      company_id: companyId,
      user_id: profile.id,
    }
    
    // 5. Insert/Update/Delete
    const { data, error } = await supabase
      .from('table_name')
      .insert([entityData])
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    // 6. Revalidate and redirect
    revalidatePath('/dashboard/...')
    redirect('/dashboard/...')
    
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}
```

## 📝 Next Steps

To use these server actions in your forms:

1. **Update form components** to call the server actions
2. **Remove localStorage usage** from forms
3. **Remove API client calls** where direct Supabase is better
4. **Test each form** after updating

Example form update:
```tsx
// Old (client-side)
const handleSubmit = async () => {
  localStorage.setItem('data', JSON.stringify(formData))
}

// New (server action)
import { createEntity } from './actions'

<form action={createEntity}>
  {/* form fields */}
</form>
```