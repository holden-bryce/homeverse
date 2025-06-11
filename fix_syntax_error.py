#!/usr/bin/env python3
"""Fix syntax error in simple_backend.py"""

# Read the file
with open('simple_backend.py', 'r') as f:
    lines = f.readlines()

# Find the problematic section (around line 3085-3090)
for i in range(len(lines)):
    if i >= 3084 and i <= 3090:
        print(f"Line {i+1}: {lines[i].rstrip()}")

# Fix: Close the try block properly
# Insert except block after line 3089 (index 3088)
if 'cursor = conn.cursor()' in lines[3089]:
    # Insert the missing code
    fix_lines = [
        '        cursor.execute("SELECT * FROM users WHERE email = ?", (request.email,))\n',
        '        user = cursor.fetchone()\n',
        '        \n',
        '        if not user or not verify_password(request.password, user["password_hash"]):\n',
        '            raise HTTPException(status_code=401, detail="Invalid credentials")\n',
        '        \n',
        '        # Create JWT token\n',
        '        access_token = create_access_token(data={\n',
        '            "sub": user["email"],\n',
        '            "user_id": user["id"],\n',
        '            "role": user["role"],\n',
        '            "company_id": user["company_id"]\n',
        '        })\n',
        '        \n',
        '        return {\n',
        '            "access_token": access_token,\n',
        '            "token_type": "bearer",\n',
        '            "user": {\n',
        '                "id": user["id"],\n',
        '                "email": user["email"],\n',
        '                "role": user["role"],\n',
        '                "full_name": user["full_name"],\n',
        '                "company_id": user["company_id"]\n',
        '            }\n',
        '        }\n',
        '    except HTTPException:\n',
        '        raise\n',
        '    except Exception as e:\n',
        '        logger.error(f"Login error: {str(e)}")\n',
        '        raise HTTPException(status_code=500, detail="Login failed")\n',
        '\n'
    ]
    
    # Replace the incomplete section
    lines = lines[:3090] + fix_lines + lines[3090:]
    
    # Write the fixed file
    with open('simple_backend.py', 'w') as f:
        f.writelines(lines)
    
    print("\n✅ Fixed syntax error in simple_backend.py")
else:
    print("\n❌ Could not find the exact location to fix")