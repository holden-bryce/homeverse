#!/usr/bin/env python3
"""
Enhanced Supabase backend validation patches for entity creation
"""

import os
import sys

def create_validation_patches():
    """Create patches to add validation to supabase_backend.py"""
    
    # Read the current backend file
    with open('supabase_backend.py', 'r') as f:
        content = f.read()
    
    # 1. Add enhanced get_current_user with profile validation
    enhanced_get_user = '''
async def get_current_user(authorization: str = Header(None)):
    """Get current user from JWT token with enhanced profile validation"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Verify token with Supabase
        user = supabase.auth.get_user(token)
        
        if not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user profile with company info
        profile = supabase.table('profiles').select('*, companies(*)').eq('id', user.user.id).single().execute()
        
        if not profile.data:
            # Profile doesn't exist - create it with default company
            default_company = supabase.table('companies').select('*').eq('key', 'default-company').single().execute()
            if not default_company.data:
                # Create default company if it doesn't exist
                default_company = supabase.table('companies').insert({
                    "name": "Default Company",
                    "key": "default-company",
                    "plan": "trial",
                    "seats": 100
                }).execute()
            
            # Create profile
            new_profile = supabase.table('profiles').insert({
                "id": user.user.id,
                "company_id": default_company.data[0]['id'] if isinstance(default_company.data, list) else default_company.data['id'],
                "role": user.user.user_metadata.get('role', 'buyer'),
                "full_name": user.user.user_metadata.get('full_name', user.user.email)
            }).execute()
            
            profile = supabase.table('profiles').select('*, companies(*)').eq('id', user.user.id).single().execute()
        
        # Validate profile has company_id
        if not profile.data.get('company_id'):
            raise HTTPException(status_code=403, detail="Profile incomplete - missing company assignment")
        
        return {
            "id": user.user.id,
            "email": user.user.email,
            "role": profile.data.get('role', 'buyer'),
            "company_id": profile.data.get('company_id'),
            "company": profile.data.get('companies'),
            "full_name": profile.data.get('full_name')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")
'''

    # 2. Add profile completion endpoint
    profile_completion_endpoint = '''
@app.post("/api/v1/users/complete-profile")
async def complete_profile(user=Depends(get_current_user)):
    """Complete user profile by ensuring company assignment"""
    try:
        # Check if profile already has company_id
        if user.get('company_id'):
            return {
                "message": "Profile already complete",
                "profile": user
            }
        
        # Get or create default company
        default_company = supabase.table('companies').select('*').eq('key', 'default-company').single().execute()
        if not default_company.data:
            default_company = supabase.table('companies').insert({
                "name": "Default Company",
                "key": "default-company",
                "plan": "trial",
                "seats": 100
            }).execute()
        
        company_id = default_company.data[0]['id'] if isinstance(default_company.data, list) else default_company.data['id']
        
        # Update profile with company_id
        updated_profile = supabase.table('profiles').update({
            "company_id": company_id
        }).eq('id', user['id']).execute()
        
        # Get updated profile
        profile = supabase.table('profiles').select('*, companies(*)').eq('id', user['id']).single().execute()
        
        return {
            "message": "Profile completed successfully",
            "profile": {
                "id": profile.data['id'],
                "email": user['email'],
                "role": profile.data.get('role', 'buyer'),
                "company_id": profile.data.get('company_id'),
                "company": profile.data.get('companies'),
                "full_name": profile.data.get('full_name')
            }
        }
    except Exception as e:
        logger.error(f"Profile completion error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
'''

    # 3. Add validation decorator for entity creation
    validation_decorator = '''
def require_complete_profile(func):
    """Decorator to ensure user has complete profile before entity operations"""
    async def wrapper(*args, user=None, **kwargs):
        if not user or not user.get('company_id'):
            raise HTTPException(
                status_code=403, 
                detail="Profile incomplete. Please complete your profile before creating entities."
            )
        return await func(*args, user=user, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper
'''

    # Write the patches to a file
    patches = f"""
# Validation Patches for supabase_backend.py

## 1. Replace the get_current_user function with this enhanced version:
{enhanced_get_user}

## 2. Add this new endpoint after the auth endpoints:
{profile_completion_endpoint}

## 3. Add this decorator before the entity creation endpoints:
{validation_decorator}

## 4. Apply the decorator to entity creation endpoints:
# Update these endpoints to use the decorator:
# - create_applicant
# - create_project
# - Any other entity creation endpoint

Example:
@app.post("/api/v1/applicants")
@require_complete_profile
async def create_applicant(applicant: ApplicantCreate, user=Depends(get_current_user)):
    # ... existing code ...
"""

    with open('supabase_backend_validation_patches.md', 'w') as f:
        f.write(patches)
    
    print("✅ Created validation patches in supabase_backend_validation_patches.md")
    print("\nNext steps:")
    print("1. Apply the patches to supabase_backend.py")
    print("2. Run the SQL script: psql <database_url> -f fix_supabase_entity_creation.sql")
    print("3. Test entity creation with all user roles")

if __name__ == "__main__":
    create_validation_patches()