# 🚀 User Creation Guide for HomeVerse

## ✅ User Creation is Working!

We can create new users in multiple ways. All methods use Supabase Auth properly.

## 📝 Methods to Create Users

### 1️⃣ **Via Backend API - Public Registration**
```bash
POST http://localhost:8000/api/v1/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "full_name": "New User",
  "role": "buyer",
  "company_key": "demo-company-2024"
}
```
- ✅ Uses admin API (auto-confirms email)
- ✅ Falls back to regular signup if needed
- ✅ Creates profile automatically

### 2️⃣ **Via Admin API - Admin Only**
```bash
POST http://localhost:8000/api/v1/admin/users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "full_name": "New User",
  "role": "buyer",
  "company_key": "demo-company-2024"
}
```
- ✅ Requires admin authentication
- ✅ Always uses admin API
- ✅ Ideal for admin dashboards

### 3️⃣ **Via Python Scripts**
```python
from supabase import create_client
import os

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

# Create user
response = supabase.auth.admin.create_user({
    'email': 'newuser@example.com',
    'password': 'SecurePassword123!',
    'email_confirm': True,
    'user_metadata': {
        'full_name': 'New User',
        'role': 'buyer'
    }
})

# Create profile
profile = supabase.table('profiles').insert({
    'id': response.user.id,
    'full_name': 'New User',
    'role': 'buyer',
    'company_id': 'your-company-id'
}).execute()
```

### 4️⃣ **Via Frontend (Self-Registration)**
The frontend registration page at `/auth/register` calls the backend API.

## 🔑 Key Points

### Why It Works Now:
1. **Admin API** - We use `supabase.auth.admin.create_user()` which bypasses email confirmation
2. **Service Role Key** - Backend uses service role key which has admin privileges
3. **Profile Creation** - We create the profile immediately after user creation
4. **Proper Error Handling** - Falls back gracefully if admin method fails

### User Roles:
- `admin` - Full system access
- `developer` - Property/project management
- `lender` - Investment and CRA reporting
- `buyer` - Browse and apply for properties
- `applicant` - Housing applications

### Important Environment Variables:
```env
SUPABASE_URL=https://vzxadsifonqklotzhdpl.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # Keep this SECRET!
SUPABASE_ANON_KEY=eyJhbGc...     # Safe for frontend
```

## 🧪 Testing User Creation

Run the test script:
```bash
python3 test_user_creation.py
```

Or use the API:
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "role": "buyer"
  }'
```

## 🚨 Common Issues & Solutions

### "User already exists"
- The email is already registered
- Use a different email or delete the existing user

### "Invalid authentication"
- Make sure backend is using SERVICE_ROLE_KEY
- Check environment variables are loaded

### "Profile creation failed"
- Ensure the user ID matches between auth.users and profiles
- Check if company exists

## ✅ Summary

User creation is fully functional! You can:
- Create users via API endpoints
- Create users programmatically in Python
- Users can self-register via frontend
- Admins can create users for others
- Email confirmation is automatically handled

The key was using the **Admin API** with the **service role key** to bypass email confirmation requirements.