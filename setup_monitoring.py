#!/usr/bin/env python3
"""
Setup monitoring and error tracking for HomeVerse
This adds Sentry integration to the backend
"""

import os

# Sentry configuration to add to supabase_backend.py
sentry_config = '''
# Error monitoring with Sentry
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

# Configure Sentry (only in production)
if os.getenv("ENVIRONMENT", "development") == "production":
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN", ""),
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            LoggingIntegration(level=logging.INFO, event_level=logging.ERROR)
        ],
        traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
        environment=os.getenv("ENVIRONMENT", "production"),
        release=os.getenv("RELEASE_VERSION", "1.0.0-beta")
    )
    logger.info("🛡️ Sentry error monitoring initialized")
'''

# Health check endpoint to add
health_check = '''
@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Check database connection
        supabase.table('companies').select('count').limit(1).execute()
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "version": "1.0.0-beta",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "healthy",
            "database": db_status,
            "email": "healthy"  # Add actual SendGrid check if needed
        }
    }

@app.get("/api/v1/metrics")
async def metrics():
    """Basic metrics endpoint"""
    return {
        "uptime": time.time() - app.state.start_time if hasattr(app.state, 'start_time') else 0,
        "version": "1.0.0-beta",
        "environment": os.getenv("ENVIRONMENT", "development")
    }
'''

# Requirements to add
requirements = '''sentry-sdk[fastapi]==1.40.0'''

# Environment variables needed
env_vars = '''
# Monitoring
SENTRY_DSN=your-sentry-dsn-here
ENVIRONMENT=production
RELEASE_VERSION=1.0.0-beta
'''

print("🛡️ Monitoring Setup Instructions")
print("=" * 50)
print("\n1. Add to requirements_supabase.txt:")
print(requirements)
print("\n2. Add to .env:")
print(env_vars)
print("\n3. Add to supabase_backend.py (after imports):")
print(sentry_config)
print("\n4. Add health check endpoint to supabase_backend.py:")
print(health_check)
print("\n5. Sign up for Sentry at https://sentry.io")
print("6. Create a new project and get your DSN")
print("7. Update .env with your Sentry DSN")
print("\n✅ This will provide:")
print("   - Error tracking and alerting")
print("   - Performance monitoring")
print("   - Health check endpoint")
print("   - Basic metrics")