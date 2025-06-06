"""Celery background tasks"""
import os
import tempfile
from typing import Dict, Any, List
from uuid import UUID
from datetime import datetime, timedelta

from celery import current_task
from jinja2 import Environment, FileSystemLoader
import weasyprint
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from app.workers.celery_app import celery_app
from app.db.database import AsyncSessionLocal
from app.db.crud import (
    get_report_run_by_id, update_report_status,
    get_applicants, get_projects, get_matches_for_applicant
)
from app.services.cra import CRAService
from app.services.matching import MatchingService
from app.services.notif import notification_service
from app.utils.logging import get_logger

logger = get_logger("tasks")


def get_async_session():
    """Get async database session for Celery tasks"""
    return AsyncSessionLocal()


async def upload_to_storage(file_content: bytes, filename: str, content_type: str) -> str:
    """Upload file to Supabase Storage and return public URL"""
    # TODO: Implement Supabase Storage upload
    # For now, return a placeholder URL
    return f"https://storage.supabase.co/homeverse/{filename}"


@celery_app.task(bind=True)
def generate_cra_report(self, report_id: str) -> Dict[str, Any]:
    """Generate CRA compliance report"""
    async def _generate_report():
        async with get_async_session() as session:
            try:
                # Update status to processing
                await update_report_status(
                    session, UUID(report_id), "processing"
                )
                
                # Get report run details
                report_run = await get_report_run_by_id(
                    session, UUID(report_id), None  # Skip company filter for background task
                )
                
                if not report_run:
                    raise ValueError(f"Report run {report_id} not found")
                
                # Generate CRA data
                cra_service = CRAService()
                cra_data = await cra_service.generate_cra_report(
                    session,
                    report_run.company_id,
                    geography=report_run.params_json.get("geography"),
                    time_period_days=report_run.params_json.get("time_period_days", 365)
                )
                
                # Generate PDF
                pdf_content = await _render_cra_pdf(cra_data)
                
                # Upload to storage
                filename = f"cra_report_{report_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
                report_url = await upload_to_storage(
                    pdf_content, filename, "application/pdf"
                )
                
                # Update report status
                await update_report_status(
                    session, UUID(report_id), "completed", report_url
                )
                
                # Send notification
                # TODO: Get user email and send notification
                
                return {
                    "status": "completed",
                    "report_url": report_url,
                    "file_size": len(pdf_content)
                }
                
            except Exception as e:
                logger.error("CRA report generation failed", report_id=report_id, error=str(e))
                await update_report_status(
                    session, UUID(report_id), "failed", error_message=str(e)
                )
                raise
    
    # Run async function in event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_generate_report())
    finally:
        loop.close()


async def _render_cra_pdf(cra_data: Dict[str, Any]) -> bytes:
    """Render CRA data to PDF using Jinja2 and WeasyPrint"""
    # Setup Jinja2 environment
    template_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
    env = Environment(loader=FileSystemLoader(template_dir))
    
    # Load template (create a basic one if not exists)
    try:
        template = env.get_template("cra_report.html")
    except:
        # Fallback to basic template
        template_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>CRA Compliance Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #2c3e50; }
                .metric { margin: 20px 0; padding: 15px; background: #f8f9fa; }
                .score { font-size: 24px; font-weight: bold; color: #27ae60; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>CRA Compliance Report</h1>
            <p><strong>Generated:</strong> {{ report_metadata.generated_at }}</p>
            <p><strong>Period:</strong> {{ report_metadata.period_start }} to {{ report_metadata.period_end }}</p>
            
            <div class="metric">
                <h2>Overall CRA Score</h2>
                <div class="score">{{ cra_scores.overall_cra_score }}%</div>
                <p>Rating: <strong>{{ cra_scores.rating }}</strong></p>
            </div>
            
            <h2>Demand Metrics</h2>
            <table>
                <tr><th>Income Level</th><th>Count</th><th>Percentage</th></tr>
                {% for level, data in demand_metrics.by_income_level.items() %}
                <tr><td>{{ level.replace('_', ' ').title() }}</td><td>{{ data.count }}</td><td>{{ "%.1f"|format(data.percentage) }}%</td></tr>
                {% endfor %}
            </table>
            
            <h2>Supply Metrics</h2>
            <table>
                <tr><th>Income Level</th><th>Projects</th><th>Units</th><th>Unit %</th></tr>
                {% for level, data in supply_metrics.by_income_level.items() %}
                <tr><td>{{ level.replace('_', ' ').title() }}</td><td>{{ data.projects }}</td><td>{{ data.units }}</td><td>{{ "%.1f"|format(data.unit_percentage) }}%</td></tr>
                {% endfor %}
            </table>
            
            <h2>Gap Analysis</h2>
            <table>
                <tr><th>Income Level</th><th>Demand</th><th>Supply</th><th>Gap</th><th>Supply Ratio</th></tr>
                {% for level, data in gap_analysis.items() %}
                {% if level != 'overall' %}
                <tr><td>{{ level.replace('_', ' ').title() }}</td><td>{{ data.demand }}</td><td>{{ data.supply }}</td><td>{{ data.gap }}</td><td>{{ data.supply_ratio }}</td></tr>
                {% endif %}
                {% endfor %}
            </table>
        </body>
        </html>
        """
        template = env.from_string(template_content)
    
    # Render HTML
    html_content = template.render(**cra_data)
    
    # Convert to PDF
    pdf = weasyprint.HTML(string=html_content).write_pdf()
    return pdf


@celery_app.task
def refresh_demand_supply_stats() -> Dict[str, Any]:
    """Refresh demand and supply statistics for all companies"""
    async def _refresh_stats():
        async with get_async_session() as session:
            # TODO: Implement stats refresh logic
            logger.info("Refreshing demand/supply statistics")
            return {"companies_processed": 0, "stats_updated": True}
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_refresh_stats())
    finally:
        loop.close()


@celery_app.task
def process_document(document_url: str, company_id: str, document_type: str = "pitch_deck") -> Dict[str, Any]:
    """Process document using Unstructured.io"""
    async def _process_doc():
        from app.services.doc_ingest import DocumentIngestService
        
        doc_service = DocumentIngestService()
        result = await doc_service.process_pdf_from_url(document_url, document_type)
        
        # TODO: Store extracted data in database
        logger.info("Document processed", url=document_url, company_id=company_id)
        
        return result
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_process_doc())
    finally:
        loop.close()


@celery_app.task
def run_matching_for_applicant(applicant_id: str, company_id: str) -> Dict[str, Any]:
    """Run AI matching for a specific applicant"""
    async def _run_matching():
        async with get_async_session() as session:
            from app.db.crud import get_applicant_by_id, get_projects
            
            # Get applicant and projects
            applicant = await get_applicant_by_id(
                session, UUID(applicant_id), UUID(company_id)
            )
            if not applicant:
                raise ValueError(f"Applicant {applicant_id} not found")
            
            projects = await get_projects(session, UUID(company_id), limit=1000)
            
            # Run matching
            matching_service = MatchingService()
            matches = await matching_service.create_matches_for_applicant(
                session, applicant, projects, UUID(company_id)
            )
            
            logger.info("Matching completed", applicant_id=applicant_id, matches_created=len(matches))
            
            return {
                "applicant_id": applicant_id,
                "matches_created": len(matches),
                "top_score": max([m.score for m in matches]) if matches else 0
            }
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_run_matching())
    finally:
        loop.close()


@celery_app.task
def send_notification_batch(notifications: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Send batch notifications"""
    async def _send_notifications():
        sent_count = 0
        failed_count = 0
        
        for notif in notifications:
            try:
                if notif["type"] == "email":
                    success = await notification_service.send_email(**notif["data"])
                elif notif["type"] == "realtime":
                    success = await notification_service.send_realtime_notification(**notif["data"])
                else:
                    continue
                
                if success:
                    sent_count += 1
                else:
                    failed_count += 1
                    
            except Exception as e:
                logger.error("Notification failed", error=str(e), notification=notif)
                failed_count += 1
        
        return {"sent": sent_count, "failed": failed_count}
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_send_notifications())
    finally:
        loop.close()


@celery_app.task
def send_weekly_digests() -> Dict[str, Any]:
    """Send weekly digest emails to all users"""
    async def _send_digests():
        # TODO: Implement weekly digest logic
        logger.info("Sending weekly digests")
        return {"digests_sent": 0}
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_send_digests())
    finally:
        loop.close()


@celery_app.task
def cleanup_old_reports() -> Dict[str, Any]:
    """Cleanup old report files and database records"""
    async def _cleanup():
        async with get_async_session() as session:
            # Delete reports older than 90 days
            cutoff_date = datetime.utcnow() - timedelta(days=90)
            
            # TODO: Implement cleanup logic
            logger.info("Cleaning up old reports", cutoff_date=cutoff_date)
            
            return {"reports_deleted": 0}
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_cleanup())
    finally:
        loop.close()