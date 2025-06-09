#!/usr/bin/env python3
"""
Webhook-based Database Initialization

This creates a simple webhook server that can initialize the database via HTTP request.
Deploy this alongside your app or as a separate service.
"""

from flask import Flask, request, jsonify
import psycopg2
import os
import hashlib
import uuid
import sys

app = Flask(__name__)

# Security token (set as environment variable)
INIT_TOKEN = os.getenv('INIT_TOKEN', 'homeverse-init-2024')

@app.route('/init-database', methods=['POST'])
def init_database():
    """Initialize database via webhook"""
    # Check authorization
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer ') or auth_header[7:] != INIT_TOKEN:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # Get database URL from request or environment
        db_url = request.json.get('database_url') or os.getenv('DATABASE_URL')
        if not db_url:
            return jsonify({'error': 'No database URL provided'}), 400
        
        # Connect to database
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS companies (
                id TEXT PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                plan TEXT DEFAULT 'trial',
                seats INTEGER DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                company_id TEXT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS applicants (
                id TEXT PRIMARY KEY,
                company_id TEXT,
                full_name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                income NUMERIC,
                household_size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                company_id TEXT,
                name TEXT NOT NULL,
                description TEXT,
                total_units INTEGER,
                available_units INTEGER,
                ami_percentage INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activities (
                id TEXT PRIMARY KEY,
                company_id TEXT,
                user_id TEXT,
                action TEXT NOT NULL,
                resource_type TEXT,
                resource_id TEXT,
                details TEXT DEFAULT '{}',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS contact_submissions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert test company
        company_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO companies (id, key, name) 
            VALUES (%s, 'demo-company-2024', 'Demo Company')
            ON CONFLICT (key) DO UPDATE SET id = EXCLUDED.id
            RETURNING id
        ''', (company_id,))
        company_id = cursor.fetchone()[0]
        
        # Hash password
        password_hash = hashlib.sha256('password123'.encode()).hexdigest()
        
        # Insert test users
        users = [
            ('developer@test.com', 'developer'),
            ('lender@test.com', 'lender'),
            ('buyer@test.com', 'buyer'),
            ('applicant@test.com', 'applicant'),
            ('admin@test.com', 'admin')
        ]
        
        users_created = []
        for email, role in users:
            user_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO users (id, email, password_hash, role, company_id)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (email) DO UPDATE 
                SET password_hash = EXCLUDED.password_hash,
                    role = EXCLUDED.role,
                    company_id = EXCLUDED.company_id
            ''', (user_id, email, password_hash, role, company_id))
            users_created.append({'email': email, 'role': role})
        
        # Commit changes
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Database initialized successfully',
            'company_id': company_id,
            'users_created': users_created
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Database initialization failed',
            'details': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    # Can be run standalone for testing
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port)

# ===== USAGE =====
# 
# Option 1: Deploy this as a separate service on Render/Heroku/etc
# Then call:
# curl -X POST https://your-webhook-service.com/init-database \
#   -H "Authorization: Bearer homeverse-init-2024" \
#   -H "Content-Type: application/json" \
#   -d '{"database_url": "postgresql://..."}'
#
# Option 2: Use as a one-time Cloud Function/Lambda
# 
# Option 3: Run locally with port forwarding (ngrok)
# python webhook_init.py
# ngrok http 5001
# Then use the ngrok URL to trigger initialization