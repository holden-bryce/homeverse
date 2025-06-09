#!/usr/bin/env python3
"""Fix final syntax issues"""

def fix_syntax():
    with open('simple_backend.py', 'r') as f:
        lines = f.readlines()
    
    # Find the problematic section starting around line 3027
    for i in range(3025, min(3070, len(lines))):
        # Fix indentation for the try block that's misaligned
        if i >= 3027 and i <= 3055:
            # These lines should be indented by 12 spaces (3 levels)
            if lines[i].strip().startswith('# Add email_verified'):
                lines[i] = '            # Add email_verified column if it doesn\'t exist\n'
            elif lines[i].strip().startswith('try:'):
                lines[i] = '            try:\n'
            elif lines[i].strip().startswith('if USE_POSTGRESQL'):
                lines[i] = '                if USE_POSTGRESQL and pg_pool:\n'
            elif lines[i].strip().startswith('cursor.execute("ALTER TABLE'):
                lines[i] = '                    cursor.execute("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE")\n'
            elif lines[i].strip() == 'else:':
                lines[i] = '                else:\n'
            elif 'SQLite doesn\'t support' in lines[i]:
                lines[i] = '                    # SQLite doesn\'t support ALTER TABLE ADD COLUMN with constraints\n'
            elif 'PRAGMA table_info' in lines[i]:
                lines[i] = '                    cursor.execute("PRAGMA table_info(users)")\n'
            elif 'columns = [column[1]' in lines[i]:
                lines[i] = '                    columns = [column[1] for column in cursor.fetchall()]\n'
            elif 'if \'email_verified\' not in columns:' in lines[i]:
                lines[i] = '                    if \'email_verified\' not in columns:\n'
            elif lines[i].strip().startswith('# Create new table'):
                lines[i] = '                        # Create new table with email_verified column\n'
            elif 'CREATE TABLE users_new' in lines[i]:
                lines[i] = '                        cursor.execute("""\n'
            elif lines[i].strip().startswith('cursor.execute("INSERT INTO users_new'):
                lines[i] = '                        cursor.execute("INSERT INTO users_new SELECT *, FALSE FROM users")\n'
            elif lines[i].strip().startswith('cursor.execute("DROP TABLE users")'):
                lines[i] = '                        cursor.execute("DROP TABLE users")\n'
            elif lines[i].strip().startswith('cursor.execute("ALTER TABLE users_new'):
                lines[i] = '                        cursor.execute("ALTER TABLE users_new RENAME TO users")\n'
            elif lines[i].strip() == 'except:':
                lines[i] = '            except:\n'
            elif 'pass  # Column might already exist' in lines[i]:
                lines[i] = '                pass  # Column might already exist\n'
    
    # Write the fixed file
    with open('simple_backend.py', 'w') as f:
        f.writelines(lines)
    
    print("✅ Fixed syntax issues")

if __name__ == "__main__":
    fix_syntax()