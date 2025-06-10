# 🔐 How Data Isolation Works in HomeVerse

## Overview

HomeVerse uses **multi-tenant architecture** where each company's data is completely isolated from others.

## Key Concepts

### 1. Company-Based Isolation
- Every user belongs to a **company**
- All data is tagged with `company_id`
- Users can only see/edit their company's data

### 2. Automatic Filtering
When you log in as `developer@test.com` from "Demo Company":
- You see only Demo Company's applicants
- You can only create projects for Demo Company
- Other companies' data is invisible to you

## How It Works

### Creating Data
```javascript
// Frontend
const createApplicant = async (data) => {
  // No need to specify company_id - backend handles it
  const response = await api.post('/applicants', data);
}

// Backend automatically adds company_id
applicant_data['company_id'] = user['company_id']  // From JWT token
```

### Viewing Data
```javascript
// Frontend request
const getApplicants = async () => {
  const response = await api.get('/applicants');
  // Returns ONLY your company's applicants
}

// Backend query with RLS
// Supabase automatically filters by company_id
```

## Example Scenario

### Company A: "Sunset Developments"
- User: alice@sunset.com
- Sees: 50 applicants created by Sunset team
- Projects: Sunset Tower, Beach Residences

### Company B: "Urban Housing"  
- User: bob@urban.com
- Sees: 30 different applicants
- Projects: City Plaza, Metro Apartments

**They never see each other's data!**

## Security Features

1. **Row Level Security (RLS)**
   - Database-level enforcement
   - Even if backend has bugs, data stays isolated

2. **JWT Tokens**
   - Contains user ID and company context
   - Verified on every request

3. **Audit Trail**
   - All actions logged with user/company info
   - Complete accountability

## Testing Data Isolation

1. Create users in different companies:
   ```sql
   -- Company 1
   INSERT INTO companies (name, key) VALUES ('Company One', 'company-one');
   
   -- Company 2  
   INSERT INTO companies (name, key) VALUES ('Company Two', 'company-two');
   ```

2. Create data as each user and verify isolation

## For Developers

When adding new features:
1. Always include `company_id` in new tables
2. Create RLS policies for new tables
3. Use `user['company_id']` from auth context
4. Never expose data without company filtering

This ensures HomeVerse can serve multiple organizations securely on the same platform!