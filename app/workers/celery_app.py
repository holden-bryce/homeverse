"""Celery application configuration"""
import os
from celery import Celery

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "homeverse",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.workers.tasks"]
)

# Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task routing
    task_routes={
        "app.workers.tasks.generate_cra_report": {"queue": "reports"},
        "app.workers.tasks.refresh_demand_supply_stats": {"queue": "analytics"},
        "app.workers.tasks.process_document": {"queue": "documents"},
        "app.workers.tasks.send_notification_batch": {"queue": "notifications"},
    },
    
    # Result backend settings
    result_expires=3600,  # 1 hour
    result_backend_transport_options={
        "master_name": os.getenv("REDIS_MASTER_NAME"),
    } if os.getenv("REDIS_MASTER_NAME") else {},
    
    # Worker settings
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=100,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        "refresh-stats-nightly": {
            "task": "app.workers.tasks.refresh_demand_supply_stats",
            "schedule": 86400.0,  # Every 24 hours
        },
        "send-weekly-digests": {
            "task": "app.workers.tasks.send_weekly_digests",
            "schedule": 604800.0,  # Every week
        },
        "cleanup-old-reports": {
            "task": "app.workers.tasks.cleanup_old_reports",
            "schedule": 3600.0,  # Every hour
        },
    },
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.workers"])

if __name__ == "__main__":
    celery_app.start()