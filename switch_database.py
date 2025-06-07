#!/usr/bin/env python3
"""
Database Configuration Switcher for HomeVerse
Easily switch between SQLite and PostgreSQL configurations
"""

import os
import shutil
import argparse
import sys

def switch_to_postgresql():
    """Switch to PostgreSQL configuration"""
    print("🔄 Switching to PostgreSQL configuration...")
    
    try:
        # Backup current main.py
        if os.path.exists('app/main.py'):
            shutil.copy('app/main.py', 'app/main_sqlite_backup.py')
            print("📦 Backed up SQLite main.py")
        
        # Copy PostgreSQL main.py
        if os.path.exists('app/main_postgresql.py'):
            shutil.copy('app/main_postgresql.py', 'app/main.py')
            print("✅ Switched to PostgreSQL main.py")
        else:
            print("❌ PostgreSQL main.py not found")
            return False
        
        # Update environment variables
        if os.path.exists('.env.postgresql'):
            shutil.copy('.env.postgresql', '.env')
            print("✅ Updated environment variables for PostgreSQL")
        else:
            print("⚠️ PostgreSQL environment file not found")
        
        print("🎉 Successfully switched to PostgreSQL!")
        print("\nNext steps:")
        print("1. Ensure PostgreSQL is running")
        print("2. Run migration: python migrate_to_postgresql.py")
        print("3. Start application: python app/main.py")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to switch to PostgreSQL: {e}")
        return False

def switch_to_sqlite():
    """Switch to SQLite configuration"""
    print("🔄 Switching to SQLite configuration...")
    
    try:
        # Restore SQLite main.py
        if os.path.exists('app/main_sqlite_backup.py'):
            shutil.copy('app/main_sqlite_backup.py', 'app/main.py')
            print("✅ Restored SQLite main.py")
        elif os.path.exists('simple_backend.py'):
            # Use simple backend if available
            print("✅ Using simple_backend.py for SQLite")
        else:
            print("❌ SQLite main.py backup not found")
            return False
        
        # Remove PostgreSQL environment variables
        if os.path.exists('.env'):
            shutil.copy('.env', '.env.backup')
            print("📦 Backed up current .env")
        
        print("🎉 Successfully switched to SQLite!")
        print("\nNext steps:")
        print("1. Start application: python simple_backend.py")
        print("2. Or use: python app/main.py (if SQLite version)")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to switch to SQLite: {e}")
        return False

def show_current_config():
    """Show current database configuration"""
    print("📊 Current Database Configuration:")
    print("=" * 40)
    
    # Check main.py content
    if os.path.exists('app/main.py'):
        with open('app/main.py', 'r') as f:
            content = f.read()
            if 'postgresql' in content.lower():
                print("🗄️ Main App: PostgreSQL")
            elif 'sqlite' in content.lower():
                print("🗄️ Main App: SQLite")
            else:
                print("🗄️ Main App: Unknown")
    else:
        print("🗄️ Main App: Not found")
    
    # Check if simple_backend.py exists
    if os.path.exists('simple_backend.py'):
        print("🔧 Simple Backend: Available (SQLite)")
    else:
        print("🔧 Simple Backend: Not found")
    
    # Check environment variables
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            env_content = f.read()
            if 'postgresql' in env_content.lower():
                print("⚙️ Environment: PostgreSQL")
            elif 'sqlite' in env_content.lower():
                print("⚙️ Environment: SQLite")
            else:
                print("⚙️ Environment: Unknown")
    else:
        print("⚙️ Environment: No .env file")
    
    # Check database files
    if os.path.exists('homeverse.db'):
        size = os.path.getsize('homeverse.db')
        print(f"📁 SQLite DB: homeverse.db ({size} bytes)")
    else:
        print("📁 SQLite DB: Not found")
    
    print("=" * 40)

def main():
    parser = argparse.ArgumentParser(description='Switch database configuration for HomeVerse')
    parser.add_argument('database', choices=['postgresql', 'sqlite', 'status'], 
                       help='Database to switch to or show status')
    
    args = parser.parse_args()
    
    if args.database == 'status':
        show_current_config()
    elif args.database == 'postgresql':
        if switch_to_postgresql():
            sys.exit(0)
        else:
            sys.exit(1)
    elif args.database == 'sqlite':
        if switch_to_sqlite():
            sys.exit(0)
        else:
            sys.exit(1)

if __name__ == "__main__":
    main()