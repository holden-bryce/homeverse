"""Contact form API endpoints"""
import os
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
from app.utils.logging import get_logger

logger = get_logger("contact")

router = APIRouter(prefix="/contact", tags=["contact"])

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    company: str = None
    phone: str = None
    subject: str
    message: str

@router.post("/")
async def submit_contact_form(
    contact_data: ContactRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, str]:
    """Submit contact form and send email"""
    
    try:
        # Add background task to send email
        background_tasks.add_task(
            send_contact_email,
            contact_data.dict()
        )
        
        logger.info("Contact form submitted", 
                   email=contact_data.email, 
                   subject=contact_data.subject)
        
        return {"message": "Contact form submitted successfully"}
        
    except Exception as e:
        logger.error("Failed to process contact form", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to process contact form")

async def send_contact_email(contact_data: Dict[str, Any]) -> None:
    """Send contact form email using SendGrid"""
    
    sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
    
    if not sendgrid_api_key:
        logger.warning("SendGrid API key not configured, skipping email")
        return
    
    try:
        sg = sendgrid.SendGridAPIClient(api_key=sendgrid_api_key)
        
        # Email to company (notification)
        from_email = Email("noreply@homeverse.app")
        to_email = To("hello@homeverse.app")  # Your company email
        
        subject = f"New Contact Form: {contact_data['subject']}"
        
        html_content = f"""
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> {contact_data['name']}</p>
        <p><strong>Email:</strong> {contact_data['email']}</p>
        <p><strong>Company:</strong> {contact_data.get('company', 'Not provided')}</p>
        <p><strong>Phone:</strong> {contact_data.get('phone', 'Not provided')}</p>
        <p><strong>Subject:</strong> {contact_data['subject']}</p>
        <p><strong>Message:</strong></p>
        <p>{contact_data['message'].replace(chr(10), '<br>')}</p>
        """
        
        content = Content("text/html", html_content)
        mail = Mail(from_email, to_email, subject, content)
        
        # Send notification email
        response = sg.client.mail.send.post(request_body=mail.get())
        logger.info("Contact notification email sent", status_code=response.status_code)
        
        # Auto-reply to customer
        customer_email = To(contact_data['email'])
        customer_subject = "Thank you for contacting HomeVerse"
        
        customer_content = Content("text/html", f"""
        <h2>Thank you for contacting HomeVerse!</h2>
        <p>Dear {contact_data['name']},</p>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p><em>"{contact_data['message']}"</em></p>
        <br>
        <p>Best regards,<br>
        The HomeVerse Team</p>
        <p><a href="https://homeverse.app">homeverse.app</a></p>
        """)
        
        customer_mail = Mail(from_email, customer_email, customer_subject, customer_content)
        
        # Send auto-reply
        response = sg.client.mail.send.post(request_body=customer_mail.get())
        logger.info("Contact auto-reply sent", 
                   email=contact_data['email'],
                   status_code=response.status_code)
        
    except Exception as e:
        logger.error("Failed to send contact email", error=str(e))
        # Don't raise exception here as it's a background task