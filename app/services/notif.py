"""Notification service using SendGrid and Supabase Realtime"""
import os
from typing import Dict, Any, List, Optional
from uuid import UUID
import json

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import httpx

from app.utils.logging import get_logger

logger = get_logger("notifications")


class NotificationService:
    """Unified notification service for email and real-time updates"""
    
    def __init__(self):
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        self.sendgrid_client = SendGridAPIClient(api_key=self.sendgrid_api_key) if self.sendgrid_api_key else None
        self.from_email = os.getenv("FROM_EMAIL", "noreply@homeverse.io")
        
        # Supabase Realtime config
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
        self.realtime_enabled = bool(self.supabase_url and self.supabase_anon_key)
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None,
        template_id: Optional[str] = None,
        dynamic_template_data: Optional[Dict] = None
    ) -> bool:
        """Send email via SendGrid"""
        if not self.sendgrid_client:
            logger.warning("SendGrid not configured, skipping email")
            return False
        
        try:
            if template_id:
                # Use dynamic template
                message = Mail(
                    from_email=Email(self.from_email),
                    to_emails=To(to_email),
                    subject=subject
                )
                message.template_id = template_id
                if dynamic_template_data:
                    message.dynamic_template_data = dynamic_template_data
            else:
                # Use content-based email
                message = Mail(
                    from_email=Email(self.from_email),
                    to_emails=To(to_email),
                    subject=subject,
                    html_content=Content("text/html", html_content)
                )
                if plain_content:
                    message.add_content(Content("text/plain", plain_content))
            
            response = self.sendgrid_client.send(message)
            
            if response.status_code in [200, 201, 202]:
                logger.info("Email sent successfully", to_email=to_email, subject=subject)
                return True
            else:
                logger.error("Failed to send email", status_code=response.status_code)
                return False
        
        except Exception as e:
            logger.error("Email sending failed", error=str(e), to_email=to_email)
            return False
    
    async def send_realtime_notification(
        self,
        company_id: UUID,
        user_id: Optional[UUID],
        notification_type: str,
        payload: Dict[str, Any],
        channel: str = "notifications"
    ) -> bool:
        """Send real-time notification via Supabase"""
        if not self.realtime_enabled:
            logger.warning("Supabase Realtime not configured")
            return False
        
        try:
            notification_data = {
                "type": notification_type,
                "company_id": str(company_id),
                "user_id": str(user_id) if user_id else None,
                "payload": payload,
                "timestamp": self._get_current_timestamp()
            }
            
            # Send to Supabase Realtime
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.supabase_anon_key}",
                    "Content-Type": "application/json",
                    "apikey": self.supabase_anon_key
                }
                
                response = await client.post(
                    f"{self.supabase_url}/rest/v1/rpc/notify_realtime",
                    json={
                        "channel": f"{channel}:{company_id}",
                        "payload": notification_data
                    },
                    headers=headers
                )
                
                if response.status_code == 200:
                    logger.info("Realtime notification sent", type=notification_type)
                    return True
                else:
                    logger.error("Failed to send realtime notification", status_code=response.status_code)
                    return False
        
        except Exception as e:
            logger.error("Realtime notification failed", error=str(e))
            return False
    
    async def notify_match_created(
        self,
        company_id: UUID,
        applicant_id: UUID,
        project_id: UUID,
        score: float,
        user_email: str
    ) -> None:
        """Notify when a new match is created"""
        # Real-time notification
        await self.send_realtime_notification(
            company_id=company_id,
            user_id=None,
            notification_type="match_created",
            payload={
                "applicant_id": str(applicant_id),
                "project_id": str(project_id),
                "score": score
            }
        )
        
        # Email notification
        await self.send_email(
            to_email=user_email,
            subject="New Housing Match Found",
            html_content=f"""
            <h2>New Housing Match</h2>
            <p>A new housing match has been found with a score of {score:.2f}.</p>
            <p>Applicant ID: {applicant_id}</p>
            <p>Project ID: {project_id}</p>
            <p><a href="https://app.homeverse.io/matches">View Match Details</a></p>
            """
        )
    
    async def notify_report_completed(
        self,
        company_id: UUID,
        user_id: UUID,
        report_id: UUID,
        report_type: str,
        report_url: str,
        user_email: str
    ) -> None:
        """Notify when a report is completed"""
        # Real-time notification
        await self.send_realtime_notification(
            company_id=company_id,
            user_id=user_id,
            notification_type="report_completed",
            payload={
                "report_id": str(report_id),
                "report_type": report_type,
                "report_url": report_url
            }
        )
        
        # Email notification
        await self.send_email(
            to_email=user_email,
            subject=f"Your {report_type.upper()} Report is Ready",
            html_content=f"""
            <h2>Report Generated Successfully</h2>
            <p>Your {report_type} report has been generated and is ready for download.</p>
            <p><a href="{report_url}">Download Report</a></p>
            """
        )
    
    async def notify_project_status_change(
        self,
        company_id: UUID,
        project_id: UUID,
        project_name: str,
        old_status: str,
        new_status: str,
        user_emails: List[str]
    ) -> None:
        """Notify when project status changes"""
        # Real-time notification
        await self.send_realtime_notification(
            company_id=company_id,
            user_id=None,
            notification_type="project_status_change",
            payload={
                "project_id": str(project_id),
                "project_name": project_name,
                "old_status": old_status,
                "new_status": new_status
            }
        )
        
        # Email notifications to relevant users
        for email in user_emails:
            await self.send_email(
                to_email=email,
                subject=f"Project Status Update: {project_name}",
                html_content=f"""
                <h2>Project Status Update</h2>
                <p>The status of project "{project_name}" has been updated:</p>
                <p><strong>From:</strong> {old_status}</p>
                <p><strong>To:</strong> {new_status}</p>
                <p><a href="https://app.homeverse.io/projects/{project_id}">View Project</a></p>
                """
            )
    
    async def send_weekly_digest(
        self,
        company_id: UUID,
        user_email: str,
        digest_data: Dict[str, Any]
    ) -> None:
        """Send weekly digest email"""
        await self.send_email(
            to_email=user_email,
            subject="HomeVerse Weekly Digest",
            template_id="d-1234567890",  # SendGrid template ID
            dynamic_template_data={
                "company_id": str(company_id),
                "week_data": digest_data,
                "dashboard_url": "https://app.homeverse.io/dashboard"
            }
        )
    
    async def send_onboarding_email(
        self,
        user_email: str,
        user_name: str,
        company_name: str,
        setup_url: str
    ) -> None:
        """Send user onboarding email"""
        await self.send_email(
            to_email=user_email,
            subject=f"Welcome to HomeVerse - {company_name}",
            html_content=f"""
            <h2>Welcome to HomeVerse, {user_name}!</h2>
            <p>You've been invited to join {company_name} on HomeVerse.</p>
            <p>HomeVerse helps you track affordable housing demand and supply, generate CRA reports, and visualize market data.</p>
            <p><a href="{setup_url}">Complete Your Setup</a></p>
            <hr>
            <p>Need help? Contact our support team at support@homeverse.io</p>
            """
        )
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"


# Global notification service instance
notification_service = NotificationService()