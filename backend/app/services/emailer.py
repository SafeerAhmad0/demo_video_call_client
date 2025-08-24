import smtplib, ssl
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

def send_email_with_attachment(subject: str, body: str, pdf_bytes: bytes, filename: str, to_override: str | None = None):
    """Send email with PDF attachment (legacy function)"""
    if not settings.SMTP_HOST:
        raise RuntimeError("SMTP not configured")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_override or settings.EMAIL_TO
    msg.set_content(body)
    msg.add_attachment(pdf_bytes, maintype="application", subtype="pdf", filename=filename)

    context = ssl.create_default_context()
    port = settings.SMTP_PORT or 587
    with smtplib.SMTP(settings.SMTP_HOST, port) as server:
        server.starttls(context=context)
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD or "")
        server.send_message(msg)

def send_claim_verification_email(
    claim_data: Dict[str, Any],
    meeting_data: Dict[str, Any],
    pdf_bytes: bytes,
    recipient_email: str,
    recording_data: Optional[Dict[str, Any]] = None
) -> bool:
    """Send claim verification report email with professional formatting"""
    
    if not settings.SMTP_HOST:
        logger.error("SMTP not configured")
        raise RuntimeError("SMTP not configured")
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"VerifyCall - Claim Verification Report: {claim_data.get('claim_number', 'N/A')}"
        msg['From'] = settings.EMAIL_FROM
        msg['To'] = recipient_email
        
        # Create HTML email body
        html_body = create_claim_verification_email_html(claim_data, meeting_data, recording_data)
        
        # Create plain text version
        text_body = create_claim_verification_email_text(claim_data, meeting_data, recording_data)
        
        # Attach both versions
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Attach PDF report
        pdf_filename = f"claim_verification_{claim_data.get('claim_number', 'report')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        pdf_attachment = MIMEApplication(pdf_bytes, _subtype='pdf')
        pdf_attachment.add_header('Content-Disposition', 'attachment', filename=pdf_filename)
        msg.attach(pdf_attachment)
        
        # Send email
        context = ssl.create_default_context()
        port = settings.SMTP_PORT or 587
        
        with smtplib.SMTP(settings.SMTP_HOST, port) as server:
            server.starttls(context=context)
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Claim verification email sent successfully to {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send claim verification email: {str(e)}")
        raise Exception(f"Email sending failed: {str(e)}")

def create_claim_verification_email_html(
    claim_data: Dict[str, Any],
    meeting_data: Dict[str, Any],
    recording_data: Optional[Dict[str, Any]] = None
) -> str:
    """Create HTML email body for claim verification"""
    
    verification_status = "COMPLETED" if recording_data else "PENDING"
    status_color = "#28a745" if recording_data else "#ffc107"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VerifyCall - Claim Verification Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
            .status-badge {{ display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; background-color: {status_color}; }}
            .info-section {{ background: white; margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }}
            .info-row {{ display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }}
            .info-label {{ font-weight: bold; color: #555; }}
            .info-value {{ color: #333; }}
            .footer {{ text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px; }}
            .recording-link {{ background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }}
            .recording-link a {{ color: #1976d2; text-decoration: none; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎥 VerifyCall</h1>
            <h2>Claim Verification Report</h2>
            <div class="status-badge">{verification_status}</div>
        </div>
        
        <div class="content">
            <div class="info-section">
                <h3>📋 Claim Information</h3>
                <div class="info-row">
                    <span class="info-label">Claim Number:</span>
                    <span class="info-value">{claim_data.get('claim_number', 'N/A')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Patient Mobile:</span>
                    <span class="info-value">{claim_data.get('patient_mobile', 'N/A')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Hospital Location:</span>
                    <span class="info-value">{claim_data.get('hospital_city', 'N/A')}, {claim_data.get('hospital_state', 'N/A')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Language:</span>
                    <span class="info-value">{claim_data.get('language', 'N/A')}</span>
                </div>
            </div>
            
            <div class="info-section">
                <h3>🎬 Video Verification</h3>
                <div class="info-row">
                    <span class="info-label">Session ID:</span>
                    <span class="info-value">{meeting_data.get('session_id', 'N/A')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Patient Name:</span>
                    <span class="info-value">{meeting_data.get('patient_name', 'N/A')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Procedure:</span>
                    <span class="info-value">{meeting_data.get('procedure', 'N/A')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Meeting Status:</span>
                    <span class="info-value">{meeting_data.get('status', 'N/A')}</span>
                </div>
    """
    
    # Add recording information if available
    if recording_data:
        html += f"""
            </div>
            
            <div class="info-section">
                <h3>📹 Recording Information</h3>
                <div class="info-row">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">{recording_data.get('duration_sec', 'N/A')} seconds</span>
                </div>
                <div class="info-row">
                    <span class="info-label">File Type:</span>
                    <span class="info-value">{recording_data.get('mime_type', 'N/A')}</span>
                </div>
        """
        
        if recording_data.get('s3_url'):
            html += f"""
                <div class="recording-link">
                    <strong>📎 Recording Link:</strong><br>
                    <a href="{recording_data.get('s3_url')}" target="_blank">View Recording</a>
                </div>
            """
        
        # Add geolocation if available
        if recording_data.get('latitude') and recording_data.get('longitude'):
            html += f"""
                <div class="info-row">
                    <span class="info-label">Location:</span>
                    <span class="info-value">Lat: {recording_data.get('latitude')}, Lon: {recording_data.get('longitude')}</span>
                </div>
            """
    
    html += f"""
            </div>
            
            <div class="info-section">
                <h3>✅ Verification Summary</h3>
                <p><strong>Status:</strong> <span style="color: {status_color}; font-weight: bold;">{verification_status}</span></p>
                <p><strong>Video Recording:</strong> {'✅ Available' if recording_data else '⏳ Not Available'}</p>
                <p><strong>Geolocation:</strong> {'✅ Captured' if recording_data and recording_data.get('latitude') else '⏳ Not Captured'}</p>
                <p><strong>Compliance:</strong> {'✅ COMPLIANT' if recording_data else '⏳ PENDING'}</p>
            </div>
            
            <div class="footer">
                <p><strong>📎 Detailed Report:</strong> Please find the complete verification report attached as a PDF.</p>
                <hr>
                <p><em>This email was generated automatically by VerifyCall system on {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}.</em></p>
                <p><em>All information is confidential and should be handled according to HIPAA guidelines.</em></p>
                <p><strong>VerifyCall</strong> - Secure Video Verification Platform</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html

def create_claim_verification_email_text(
    claim_data: Dict[str, Any],
    meeting_data: Dict[str, Any],
    recording_data: Optional[Dict[str, Any]] = None
) -> str:
    """Create plain text email body for claim verification"""
    
    verification_status = "COMPLETED" if recording_data else "PENDING"
    
    text = f"""
VerifyCall - Claim Verification Report

VERIFICATION STATUS: {verification_status}

CLAIM INFORMATION:
- Claim Number: {claim_data.get('claim_number', 'N/A')}
- Patient Mobile: {claim_data.get('patient_mobile', 'N/A')}
- Hospital Location: {claim_data.get('hospital_city', 'N/A')}, {claim_data.get('hospital_state', 'N/A')}
- Language: {claim_data.get('language', 'N/A')}

VIDEO VERIFICATION:
- Session ID: {meeting_data.get('session_id', 'N/A')}
- Patient Name: {meeting_data.get('patient_name', 'N/A')}
- Procedure: {meeting_data.get('procedure', 'N/A')}
- Meeting Status: {meeting_data.get('status', 'N/A')}
"""
    
    if recording_data:
        text += f"""
RECORDING INFORMATION:
- Duration: {recording_data.get('duration_sec', 'N/A')} seconds
- File Type: {recording_data.get('mime_type', 'N/A')}
"""
        
        if recording_data.get('s3_url'):
            text += f"- Recording Link: {recording_data.get('s3_url')}\n"
        
        if recording_data.get('latitude') and recording_data.get('longitude'):
            text += f"- Location: Lat: {recording_data.get('latitude')}, Lon: {recording_data.get('longitude')}\n"
    
    text += f"""
VERIFICATION SUMMARY:
- Status: {verification_status}
- Video Recording: {'Available' if recording_data else 'Not Available'}
- Geolocation: {'Captured' if recording_data and recording_data.get('latitude') else 'Not Captured'}
- Compliance: {'COMPLIANT' if recording_data else 'PENDING'}

ATTACHMENT:
Please find the complete verification report attached as a PDF.

---
This email was generated automatically by VerifyCall system on {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}.
All information is confidential and should be handled according to HIPAA guidelines.

VerifyCall - Secure Video Verification Platform
"""
    
    return text

def send_simple_notification_email(
    to_email: str,
    subject: str,
    message: str,
    claim_number: Optional[str] = None
) -> bool:
    """Send a simple notification email"""
    
    if not settings.SMTP_HOST:
        logger.error("SMTP not configured")
        return False
    
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = settings.EMAIL_FROM
        msg['To'] = to_email
        
        # Create formatted message
        formatted_message = f"""
VerifyCall Notification

{message}

{f'Claim Number: {claim_number}' if claim_number else ''}

---
This is an automated notification from VerifyCall system.
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}

VerifyCall - Secure Video Verification Platform
        """.strip()
        
        msg.set_content(formatted_message)
        
        # Send email
        context = ssl.create_default_context()
        port = settings.SMTP_PORT or 587
        
        with smtplib.SMTP(settings.SMTP_HOST, port) as server:
            server.starttls(context=context)
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Notification email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send notification email: {str(e)}")
        return False
