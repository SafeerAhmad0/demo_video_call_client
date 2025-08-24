from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import logging

from app.db.models import Claim, Meeting, Recording, FormSubmission
from app.services.pdf import generate_claim_verification_report, save_pdf_to_file
from app.services.emailer import send_claim_verification_email
from app.services.s3 import upload_file_to_s3, s3_key_for_recording

logger = logging.getLogger(__name__)

class ReportService:
    """Service for generating and sending claim verification reports"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def generate_and_send_claim_report(
        self,
        claim_id: int,
        recipient_email: str,
        form_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate comprehensive claim verification report and send via email"""
        
        try:
            # Get claim data
            claim_result = await self.session.execute(
                select(Claim).where(Claim.id == claim_id)
            )
            claim = claim_result.scalar_one_or_none()
            
            if not claim:
                raise ValueError(f"Claim with ID {claim_id} not found")
            
            # Get meeting data
            meeting_result = await self.session.execute(
                select(Meeting).where(Meeting.claim_id == claim_id).order_by(Meeting.created_at.desc())
            )
            meeting = meeting_result.scalar_one_or_none()
            
            if not meeting:
                raise ValueError(f"No meeting found for claim {claim.claim_number}")
            
            # Get recording data (if available)
            recording = None
            if meeting:
                recording_result = await self.session.execute(
                    select(Recording).where(Recording.meeting_id == meeting.id).order_by(Recording.created_at.desc())
                )
                recording = recording_result.scalar_one_or_none()
            
            # Convert to dictionaries for PDF generation
            claim_data = {
                'id': claim.id,
                'claim_number': claim.claim_number,
                'patient_mobile': claim.patient_mobile,
                'hospital_city': claim.hospital_city,
                'hospital_state': claim.hospital_state,
                'language': claim.language,
                'status': claim.status,
                'created_at': claim.created_at.strftime('%Y-%m-%d %H:%M:%S') if claim.created_at else 'N/A'
            }
            
            meeting_data = {
                'id': meeting.id,
                'session_id': meeting.session_id,
                'room_name': meeting.room_name,
                'patient_name': meeting.patient_name,
                'procedure': meeting.procedure,
                'status': meeting.status,
                'created_at': meeting.created_at.strftime('%Y-%m-%d %H:%M:%S') if meeting.created_at else 'N/A'
            }
            
            recording_data = None
            if recording:
                recording_data = {
                    'id': recording.id,
                    's3_key': recording.s3_key,
                    's3_url': recording.s3_url,
                    'mime_type': recording.mime_type,
                    'duration_sec': recording.duration_sec,
                    'latitude': recording.latitude,
                    'longitude': recording.longitude,
                    'geo_accuracy_m': recording.geo_accuracy_m,
                    'created_at': recording.created_at.strftime('%Y-%m-%d %H:%M:%S') if recording.created_at else 'N/A'
                }
            
            # Generate PDF report
            pdf_buffer = generate_claim_verification_report(
                claim_data=claim_data,
                meeting_data=meeting_data,
                recording_data=recording_data,
                form_data=form_data
            )
            
            # Save PDF to file (optional - for local storage)
            pdf_filename = f"claim_verification_{claim.claim_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            pdf_file_path = save_pdf_to_file(pdf_buffer, pdf_filename)
            
            # Send email with PDF attachment
            pdf_bytes = pdf_buffer.getvalue()
            email_sent = send_claim_verification_email(
                claim_data=claim_data,
                meeting_data=meeting_data,
                pdf_bytes=pdf_bytes,
                recipient_email=recipient_email,
                recording_data=recording_data
            )
            
            # Upload PDF to S3 (optional)
            s3_url = None
            try:
                s3_key = s3_key_for_recording(pdf_filename)
                s3_url = upload_file_to_s3(pdf_file_path, s3_key, "application/pdf")
                logger.info(f"PDF report uploaded to S3: {s3_url}")
            except Exception as e:
                logger.warning(f"Failed to upload PDF to S3: {str(e)}")
            
            return {
                'success': True,
                'claim_number': claim.claim_number,
                'report_generated': True,
                'email_sent': email_sent,
                'pdf_file_path': pdf_file_path,
                's3_url': s3_url,
                'recipient_email': recipient_email,
                'verification_status': 'COMPLETED' if recording_data else 'PENDING',
                'message': 'Claim verification report generated and sent successfully'
            }
            
        except Exception as e:
            logger.error(f"Failed to generate claim report: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to generate claim verification report'
            }
    
    async def get_claim_summary(self, claim_id: int) -> Dict[str, Any]:
        """Get comprehensive summary of claim verification status"""
        
        try:
            # Get claim
            claim_result = await self.session.execute(
                select(Claim).where(Claim.id == claim_id)
            )
            claim = claim_result.scalar_one_or_none()
            
            if not claim:
                return {'success': False, 'error': 'Claim not found'}
            
            # Get meetings
            meetings_result = await self.session.execute(
                select(Meeting).where(Meeting.claim_id == claim_id).order_by(Meeting.created_at.desc())
            )
            meetings = meetings_result.scalars().all()
            
            # Get recordings
            recordings = []
            for meeting in meetings:
                recording_result = await self.session.execute(
                    select(Recording).where(Recording.meeting_id == meeting.id)
                )
                meeting_recordings = recording_result.scalars().all()
                recordings.extend(meeting_recordings)
            
            # Calculate verification status
            has_completed_meeting = any(m.status == 'completed' for m in meetings)
            has_recording = len(recordings) > 0
            has_geolocation = any(r.latitude and r.longitude for r in recordings)
            
            verification_status = 'VERIFIED' if (has_completed_meeting and has_recording) else 'PENDING'
            
            return {
                'success': True,
                'claim': {
                    'id': claim.id,
                    'claim_number': claim.claim_number,
                    'patient_mobile': claim.patient_mobile,
                    'hospital_city': claim.hospital_city,
                    'hospital_state': claim.hospital_state,
                    'language': claim.language,
                    'status': claim.status,
                    'created_at': claim.created_at
                },
                'meetings_count': len(meetings),
                'recordings_count': len(recordings),
                'verification_status': verification_status,
                'has_completed_meeting': has_completed_meeting,
                'has_recording': has_recording,
                'has_geolocation': has_geolocation,
                'latest_meeting': {
                    'session_id': meetings[0].session_id,
                    'status': meetings[0].status,
                    'created_at': meetings[0].created_at
                } if meetings else None,
                'latest_recording': {
                    'id': recordings[0].id,
                    's3_url': recordings[0].s3_url,
                    'duration_sec': recordings[0].duration_sec,
                    'created_at': recordings[0].created_at
                } if recordings else None
            }
            
        except Exception as e:
            logger.error(f"Failed to get claim summary: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

async def create_report_service(session: AsyncSession) -> ReportService:
    """Factory function to create ReportService instance"""
    return ReportService(session)
