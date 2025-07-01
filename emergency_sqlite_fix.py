#!/usr/bin/env python3
"""
Emergency fix: Switch to SQLite temporarily
"""

def create_render_yaml_fix():
    """Create render.yaml that forces SQLite"""
    content = '''services:
  - type: web
    name: homeverse-api
    runtime: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "python simple_backend.py"
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: homeverse-db
          property: connectionString
      - key: JWT_SECRET_KEY
        generateValue: true
      - key: REDIS_URL
        value: redis://localhost:6379
      - key: USE_SQLITE
        value: "true"
      - key: DATABASE_PATH
        value: "homeverse_demo.db"
      - key: CORS_ORIGINS
        value: "*"
      - key: RESEND_API_KEY
        sync: false

databases:
  - name: homeverse-db
    plan: starter
    databaseName: homeverse_db
    user: homeverse_user
'''
    
    with open('render.yaml', 'w') as f:
        f.write(content)
    
    print("✅ Created render.yaml with SQLite configuration")
    print("\nThis will:")
    print("1. Force the backend to use SQLite instead of PostgreSQL")
    print("2. Use the existing demo database with test users")
    print("3. Fix authentication immediately")
    print("\nCommit and push to deploy this emergency fix.")

if __name__ == "__main__":
    create_render_yaml_fix()