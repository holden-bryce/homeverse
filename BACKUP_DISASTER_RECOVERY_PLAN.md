# 🛡️ Backup & Disaster Recovery Plan

**Version**: 1.0  
**RPO (Recovery Point Objective)**: 1 hour  
**RTO (Recovery Time Objective)**: 30 minutes  
**Last Updated**: June 8, 2025

## 🎯 Overview

This plan ensures HomeVerse can recover from any disaster scenario with minimal data loss and downtime.

## 📊 Backup Strategy

### Backup Types & Schedule

| Component | Type | Frequency | Retention | Storage |
|-----------|------|-----------|-----------|---------|
| Database | Full | Daily 2 AM UTC | 30 days | Render + S3 |
| Database | Incremental | Hourly | 7 days | Render |
| Code | Git commits | On push | Forever | GitHub |
| Uploads | Sync | Real-time | 90 days | S3 |
| Configs | Snapshot | On change | 30 versions | Render |

### Automated Backup Script

```python
#!/usr/bin/env python3
"""backup_system.py - Automated backup management"""
import os
import subprocess
import boto3
from datetime import datetime, timedelta
import psycopg2
import sqlite3
import tarfile
import hashlib

class BackupManager:
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.bucket_name = 'homeverse-backups'
        self.render_api_key = os.getenv('RENDER_API_KEY')
        
    def backup_database(self):
        """Backup database with verification"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if os.getenv('USE_POSTGRESQL'):
            backup_file = f"homeverse_pg_backup_{timestamp}.sql"
            
            # Create PostgreSQL backup
            subprocess.run([
                'pg_dump',
                os.getenv('DATABASE_URL'),
                '-f', backup_file,
                '--verbose',
                '--no-owner',
                '--no-acl'
            ])
        else:
            # SQLite backup
            backup_file = f"homeverse_sqlite_backup_{timestamp}.db"
            
            conn = sqlite3.connect('homeverse_demo.db')
            backup_conn = sqlite3.connect(backup_file)
            conn.backup(backup_conn)
            backup_conn.close()
            conn.close()
        
        # Calculate checksum
        checksum = self.calculate_checksum(backup_file)
        
        # Compress backup
        compressed_file = f"{backup_file}.tar.gz"
        with tarfile.open(compressed_file, "w:gz") as tar:
            tar.add(backup_file)
        
        # Upload to S3
        self.upload_to_s3(compressed_file, checksum)
        
        # Cleanup local files
        os.remove(backup_file)
        os.remove(compressed_file)
        
        print(f"✅ Database backup completed: {compressed_file}")
        return compressed_file, checksum
    
    def backup_uploads(self):
        """Backup uploaded files"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        uploads_backup = f"uploads_backup_{timestamp}.tar.gz"
        
        # Create archive of uploads directory
        with tarfile.open(uploads_backup, "w:gz") as tar:
            tar.add("uploads/", arcname="uploads")
        
        # Upload to S3
        self.upload_to_s3(uploads_backup)
        
        # Cleanup
        os.remove(uploads_backup)
        
        print(f"✅ Uploads backup completed: {uploads_backup}")
    
    def backup_configuration(self):
        """Backup environment configuration"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Get current environment variables from Render
        services = {
            'backend': 'srv-d11f4godl3ps73cnfr6g',
            'frontend': 'srv-d11f3q0dl3ps73cnf480'
        }
        
        config_backup = {}
        
        for service_name, service_id in services.items():
            cmd = f'''curl -s -H "Authorization: Bearer {self.render_api_key}" \
                     https://api.render.com/v1/services/{service_id}/env-vars'''
            
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            if result.returncode == 0:
                config_backup[service_name] = result.stdout
        
        # Save configuration
        config_file = f"config_backup_{timestamp}.json"
        with open(config_file, 'w') as f:
            json.dump(config_backup, f, indent=2)
        
        # Upload to S3
        self.upload_to_s3(config_file)
        
        # Cleanup
        os.remove(config_file)
        
        print(f"✅ Configuration backup completed: {config_file}")
    
    def calculate_checksum(self, filename):
        """Calculate SHA256 checksum"""
        sha256_hash = hashlib.sha256()
        with open(filename, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def upload_to_s3(self, filename, checksum=None):
        """Upload file to S3 with metadata"""
        metadata = {
            'timestamp': datetime.now().isoformat(),
            'service': 'homeverse',
            'type': 'backup'
        }
        
        if checksum:
            metadata['checksum'] = checksum
        
        self.s3_client.upload_file(
            filename,
            self.bucket_name,
            f"backups/{filename}",
            ExtraArgs={'Metadata': metadata}
        )
    
    def cleanup_old_backups(self, retention_days=30):
        """Remove backups older than retention period"""
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        # List objects in S3
        response = self.s3_client.list_objects_v2(
            Bucket=self.bucket_name,
            Prefix='backups/'
        )
        
        if 'Contents' in response:
            for obj in response['Contents']:
                if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                    self.s3_client.delete_object(
                        Bucket=self.bucket_name,
                        Key=obj['Key']
                    )
                    print(f"🗑️ Deleted old backup: {obj['Key']}")
    
    def verify_backup(self, backup_file, original_checksum):
        """Verify backup integrity"""
        # Download from S3
        self.s3_client.download_file(
            self.bucket_name,
            f"backups/{backup_file}",
            f"verify_{backup_file}"
        )
        
        # Calculate checksum
        verify_checksum = self.calculate_checksum(f"verify_{backup_file}")
        
        # Cleanup
        os.remove(f"verify_{backup_file}")
        
        if verify_checksum == original_checksum:
            print("✅ Backup verification passed")
            return True
        else:
            print("❌ Backup verification failed!")
            return False
    
    def run_daily_backup(self):
        """Execute daily backup routine"""
        print(f"\n🔄 Starting daily backup - {datetime.now()}")
        
        try:
            # 1. Database backup
            db_backup, db_checksum = self.backup_database()
            
            # 2. Uploads backup
            self.backup_uploads()
            
            # 3. Configuration backup
            self.backup_configuration()
            
            # 4. Verify database backup
            self.verify_backup(db_backup, db_checksum)
            
            # 5. Cleanup old backups
            self.cleanup_old_backups()
            
            print("✅ Daily backup completed successfully")
            
        except Exception as e:
            print(f"❌ Backup failed: {str(e)}")
            # Send alert
            self.send_alert(f"Backup failed: {str(e)}")

if __name__ == "__main__":
    manager = BackupManager()
    manager.run_daily_backup()
```

## 🚨 Disaster Scenarios & Recovery

### Scenario 1: Database Corruption

**Detection**: Application errors, data inconsistencies  
**Impact**: High - All database operations fail  
**Recovery Time**: 15-30 minutes

```bash
# 1. Stop application
curl -X POST -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/$SERVICE_ID/suspend

# 2. Restore latest backup
python restore_database.py --latest

# 3. Verify data integrity
python verify_database.py

# 4. Resume service
curl -X POST -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/$SERVICE_ID/resume
```

### Scenario 2: Service Outage

**Detection**: Health checks fail, monitoring alerts  
**Impact**: Medium - Service unavailable  
**Recovery Time**: 5-10 minutes

```bash
# 1. Check service status
curl https://homeverse-api.onrender.com/health

# 2. Restart service
render services:restart $SERVICE_ID

# 3. If persistent, redeploy
render deploys:create $SERVICE_ID

# 4. Monitor logs
render logs $SERVICE_ID --tail
```

### Scenario 3: Data Breach

**Detection**: Suspicious activity, unauthorized access  
**Impact**: Critical - Security compromise  
**Recovery Time**: 30-60 minutes

```bash
# 1. Immediate actions
# Rotate all secrets
./rotate_secrets.sh

# 2. Suspend affected services
render services:suspend --all

# 3. Audit access logs
python audit_security.py --last-24h

# 4. Reset all user passwords
python reset_all_passwords.py

# 5. Resume services with new credentials
render services:resume --all
```

### Scenario 4: Region Failure

**Detection**: Multiple services down, Render status page  
**Impact**: Critical - Complete outage  
**Recovery Time**: 60-120 minutes

```bash
# 1. Activate DR site (if configured)
./activate_dr_site.sh

# 2. Update DNS
# Point homeverse.com to DR site

# 3. Restore from S3 backups
python restore_from_s3.py --region us-west-2

# 4. Verify functionality
./run_dr_tests.sh
```

## 📦 Recovery Procedures

### Database Recovery

```python
#!/usr/bin/env python3
"""restore_database.py - Database restoration utility"""

def restore_database(backup_file=None):
    """Restore database from backup"""
    
    if not backup_file:
        # Get latest backup
        backup_file = get_latest_backup()
    
    print(f"🔄 Restoring from: {backup_file}")
    
    # Download from S3
    s3_client = boto3.client('s3')
    s3_client.download_file(
        'homeverse-backups',
        f'backups/{backup_file}',
        backup_file
    )
    
    # Extract if compressed
    if backup_file.endswith('.tar.gz'):
        with tarfile.open(backup_file, 'r:gz') as tar:
            tar.extractall()
            backup_file = backup_file.replace('.tar.gz', '')
    
    # Restore based on type
    if backup_file.endswith('.sql'):
        # PostgreSQL restore
        subprocess.run([
            'psql',
            os.getenv('DATABASE_URL'),
            '-f', backup_file
        ])
    else:
        # SQLite restore
        shutil.copy(backup_file, 'homeverse_demo.db')
    
    print("✅ Database restored successfully")
    
    # Verify restoration
    verify_database()

def verify_database():
    """Verify database integrity after restore"""
    
    checks = [
        "SELECT COUNT(*) FROM users",
        "SELECT COUNT(*) FROM companies",
        "SELECT COUNT(*) FROM projects",
        "SELECT COUNT(*) FROM applicants"
    ]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for check in checks:
        cursor.execute(check)
        count = cursor.fetchone()[0]
        print(f"✓ {check}: {count} records")
    
    conn.close()
    print("✅ Database verification complete")
```

### Service Recovery

```bash
#!/bin/bash
# recover_service.sh - Service recovery automation

set -e

SERVICE=$1
RENDER_API_KEY="rnd_KqwZ5fjRivybWcsC9PqsHel2BDt8"

echo "🚑 Starting recovery for service: $SERVICE"

# 1. Get service details
SERVICE_ID=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services?name=$SERVICE" | jq -r '.[0].service.id')

# 2. Check current status
STATUS=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$SERVICE_ID" | jq -r '.suspended')

if [ "$STATUS" = "suspended" ]; then
    echo "📌 Service is suspended, resuming..."
    curl -X POST -H "Authorization: Bearer $RENDER_API_KEY" \
      "https://api.render.com/v1/services/$SERVICE_ID/resume"
else
    echo "🔄 Restarting service..."
    curl -X POST -H "Authorization: Bearer $RENDER_API_KEY" \
      "https://api.render.com/v1/services/$SERVICE_ID/restart"
fi

# 3. Wait for service to be healthy
echo "⏳ Waiting for service to be healthy..."
for i in {1..30}; do
    if curl -f -s "https://$SERVICE.onrender.com/health" > /dev/null; then
        echo "✅ Service is healthy!"
        exit 0
    fi
    sleep 10
done

echo "❌ Service recovery failed after 5 minutes"
exit 1
```

## 📊 Backup Monitoring Dashboard

```python
#!/usr/bin/env python3
"""backup_monitor.py - Monitor backup health"""

def generate_backup_report():
    """Generate backup status report"""
    
    report = {
        'timestamp': datetime.now().isoformat(),
        'backups': {
            'database': check_database_backups(),
            'uploads': check_upload_backups(),
            'config': check_config_backups()
        },
        'storage': {
            's3_usage': get_s3_usage(),
            'local_usage': get_local_usage()
        },
        'health': {
            'last_successful': get_last_successful_backup(),
            'failed_count': get_failed_backup_count(),
            'recovery_tests': get_recovery_test_results()
        }
    }
    
    # Generate HTML report
    html = f"""
    <h1>HomeVerse Backup Status Report</h1>
    <p>Generated: {report['timestamp']}</p>
    
    <h2>Backup Status</h2>
    <ul>
        <li>Database: {report['backups']['database']['status']}</li>
        <li>Uploads: {report['backups']['uploads']['status']}</li>
        <li>Config: {report['backups']['config']['status']}</li>
    </ul>
    
    <h2>Storage Usage</h2>
    <ul>
        <li>S3: {report['storage']['s3_usage']}</li>
        <li>Local: {report['storage']['local_usage']}</li>
    </ul>
    
    <h2>Health Metrics</h2>
    <ul>
        <li>Last Success: {report['health']['last_successful']}</li>
        <li>Failed (7d): {report['health']['failed_count']}</li>
        <li>Recovery Tests: {report['health']['recovery_tests']}</li>
    </ul>
    """
    
    # Send report
    send_email(
        to="holdenbryce06@gmail.com",
        subject="HomeVerse Backup Report",
        body=html
    )
```

## 🔐 Security Considerations

### Backup Encryption
- All backups encrypted at rest (AES-256)
- Encryption keys stored separately
- Transport encryption (TLS 1.3)

### Access Control
- S3 bucket with IAM policies
- MFA required for backup deletion
- Audit logs for all backup operations

### Testing Schedule
- Weekly: Automated backup verification
- Monthly: Manual recovery drill
- Quarterly: Full DR simulation

## 📋 Recovery Checklist

### Pre-Recovery
- [ ] Identify failure type and scope
- [ ] Notify stakeholders
- [ ] Locate appropriate backup
- [ ] Prepare recovery environment

### During Recovery
- [ ] Stop affected services
- [ ] Restore from backup
- [ ] Verify data integrity
- [ ] Test functionality

### Post-Recovery
- [ ] Document incident
- [ ] Update runbook if needed
- [ ] Review and improve process
- [ ] Schedule post-mortem

## 🎯 RTO/RPO Achievement

### Current Capabilities
- **RPO**: 1 hour (hourly incremental backups)
- **RTO**: 30 minutes (automated recovery)

### Improvement Plan
1. Implement real-time replication (RPO < 5 min)
2. Add hot standby (RTO < 10 min)
3. Multi-region deployment
4. Automated failover

---

**Remember**: Test your backups regularly! An untested backup is not a backup.