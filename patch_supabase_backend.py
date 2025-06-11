#!/usr/bin/env python3
"""
Patch script to update supabase_backend.py with better profile handling
"""

import re

def apply_patches():
    # Read the current backend
    with open('supabase_backend.py', 'r') as f:
        content = f.read()
    
    # Backup original
    with open('supabase_backend.py.backup', 'w') as f:
        f.write(content)
    
    # 1. Find and replace get_current_user function
    new_get_current_user = '''async def get_current_user(authorization: str = Header(None)):
    """Get current user from JWT token with automatic profile creation"""
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
        
        if not profile.data or not profile.data.get('company_id'):
            # Profile missing or incomplete - fix it
            logger.warning(f"Incomplete profile for user {user.user.email}, attempting to fix...")
            
            # Get default company
            default_company = supabase.table('companies').select('*').eq('key', 'default-company').single().execute()
            if not default_company.data:
                # Create default company
                default_company = supabase.table('companies').insert({
                    "name": "Default Company",
                    "key": "default-company",
                    "plan": "trial",
                    "seats": 100
                }).execute()
                company_id = default_company.data[0]['id']
            else:
                company_id = default_company.data['id']
            
            if not profile.data:
                # Create new profile
                new_profile = supabase.table('profiles').insert({
                    "id": user.user.id,
                    "company_id": company_id,
                    "role": user.user.user_metadata.get('role', 'buyer'),
                    "full_name": user.user.user_metadata.get('full_name', user.user.email)
                }).execute()
            else:
                # Update existing profile with company_id
                supabase.table('profiles').update({
                    "company_id": company_id
                }).eq('id', user.user.id).execute()
            
            # Re-fetch profile
            profile = supabase.table('profiles').select('*, companies(*)').eq('id', user.user.id).single().execute()
        
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
        raise HTTPException(status_code=401, detail="Authentication failed")'''

    # Find the existing get_current_user function
    pattern = r'async def get_current_user\(.*?\):\s*""".*?""".*?(?=\nasync def|\nclass|\n@app|\Z)'
    
    # Replace it
    content = re.sub(pattern, new_get_current_user, content, flags=re.DOTALL)
    
    # 2. Add profile completion endpoint after auth endpoints
    profile_endpoint = '''
@app.post("/api/v1/users/complete-profile")
async def complete_profile(user=Depends(get_current_user)):
    """Complete user profile by ensuring company assignment"""
    try:
        if user.get('company_id'):
            return {
                "message": "Profile already complete",
                "profile": user
            }
        
        # This shouldn't happen with the new get_current_user, but just in case
        return {
            "message": "Profile auto-completed",
            "profile": user
        }
    except Exception as e:
        logger.error(f"Profile completion error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/users/profile-status")
async def get_profile_status(user=Depends(get_current_user)):
    """Get current user's profile status"""
    return {
        "profile_complete": bool(user.get('company_id')),
        "user": user
    }'''

    # Find a good place to insert (after logout endpoint)
    logout_pattern = r'(@app\.post\("/api/v1/auth/logout"\).*?return {"message": "Logout completed"})'
    match = re.search(logout_pattern, content, re.DOTALL)
    if match:
        insert_pos = match.end()
        content = content[:insert_pos] + '\n' + profile_endpoint + content[insert_pos:]
    
    # Save the patched file
    with open('supabase_backend_patched.py', 'w') as f:
        f.write(content)
    
    print("✅ Created patched backend: supabase_backend_patched.py")
    print("\nTo apply:")
    print("1. Review the changes: diff supabase_backend.py supabase_backend_patched.py")
    print("2. Apply: cp supabase_backend_patched.py supabase_backend.py")
    print("3. Restart backend: python3 supabase_backend.py")

if __name__ == "__main__":
    apply_patches()