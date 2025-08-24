from fastapi import APIRouter, Depends, HTTPException, status
from uuid import uuid4
import time, jwt, os
from datetime import datetime, timedelta
from typing import Optional
from twilio.rest import Client
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, select, update

from app.core.config import settings
from app.db.models import Meeting, Claim
from app.db.session import get_session
from app.db.schemas import NewRoomOut, VideoCallRequest, VideoCallResponse, VideoCallStatusResponse

router = APIRouter(prefix="/meetings", tags=["meetings"])

# Twilio client initialization
def get_twilio_client():
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    if account_sid and auth_token:
        return Client(account_sid, auth_token)
    return None

def build_jitsi_jwt(room: str, user_name: str = "User", moderator: bool = True) -> str | None:
    """Generate JWT token for Jitsi Meet authentication"""
    jitsi_app_id = os.getenv("JITSI_APP_ID", "verifycall")
    jitsi_app_secret = os.getenv("JITSI_APP_SECRET", "your-jitsi-app-secret")
    
    if not jitsi_app_secret:
        return None
        
    now = int(time.time())
    payload = {
        "aud": "verifycall",
        "iss": jitsi_app_id,
        "sub": "meet.jitsi",
        "room": room,
        "exp": now + 60 * 60 * 2,  # 2 hours
        "nbf": now - 10,
        "context": {
            "user": {
                "name": user_name,
                "moderator": moderator,
                "id": str(uuid4())
            }
        },
    }
    token = jwt.encode(payload, jitsi_app_secret, algorithm="HS256")
    return token

@router.post("/new-room", response_model=NewRoomOut)
async def new_room(session: AsyncSession = Depends(get_session)):
    """Create a new Jitsi meeting room (legacy endpoint)"""
    room = f"room-{uuid4().hex[:10]}"
    stmt = insert(Meeting).values(
        room_name=room,
        session_id=str(uuid4())
    ).returning(Meeting.id)
    await session.execute(stmt)
    await session.commit()
    
    token = build_jitsi_jwt(room)
    jitsi_domain = os.getenv("JITSI_DOMAIN", "localhost:8000")
    
    return NewRoomOut(roomName=room, domain=jitsi_domain, jwt=token)

@router.post("/video-call/create", response_model=VideoCallResponse)
async def create_video_call(
    request: VideoCallRequest,
    session: AsyncSession = Depends(get_session)
):
    """Create a video call session for claim verification"""
    
    # Generate unique session ID and room name
    session_id = str(uuid4())
    room_name = f"claim-{request.claimId}-{uuid4().hex[:8]}"
    
    # Get claim details if claim ID provided
    claim = None
    if request.claimId and request.claimId != "CLM-2025-8847":  # Skip for demo claim
        result = await session.execute(select(Claim).where(Claim.claim_number == request.claimId))
        claim = result.scalar_one_or_none()
        
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Claim not found"
            )
    
    # Create meeting record
    stmt = insert(Meeting).values(
        room_name=room_name,
        session_id=session_id,
        claim_id=claim.id if claim else None,
        patient_name=request.patientName,
        procedure=request.procedure,
        status="pending"
    ).returning(Meeting.id)
    
    result = await session.execute(stmt)
    meeting_id = result.scalar_one()
    await session.commit()
    
    # Generate JWT tokens for both moderator and participant
    moderator_token = build_jitsi_jwt(room_name, "Moderator", moderator=True)
    patient_token = build_jitsi_jwt(room_name, request.patientName or "Patient", moderator=False)
    
    # Build meeting URLs
    jitsi_domain = os.getenv("JITSI_DOMAIN", "localhost:8000")
    base_url = f"http://{jitsi_domain}"
    
    moderator_url = f"{base_url}/{room_name}?jwt={moderator_token}" if moderator_token else f"{base_url}/{room_name}"
    patient_url = f"{base_url}/{room_name}?jwt={patient_token}" if patient_token else f"{base_url}/{room_name}"
    
    # Send SMS to patient if phone number available from claim
    sms_sent = False
    if claim and claim.patient_mobile:
        try:
            twilio_client = get_twilio_client()
            if twilio_client:
                message_body = f"""
VerifyCall Video Verification

Hello {request.patientName or 'Patient'},

Please join your video verification call for claim {request.claimId}:

🔗 Meeting Link: {patient_url}

📋 Procedure: {request.procedure or 'Medical Verification'}

⏰ Please join as soon as possible. The call will be recorded for verification purposes.

If you have any issues, please contact support.

Thank you,
VerifyCall Team
                """.strip()
                
                twilio_phone = os.getenv("TWILIO_PHONE_NUMBER", "+1234567890")
                
                message = twilio_client.messages.create(
                    body=message_body,
                    from_=twilio_phone,
                    to=claim.patient_mobile
                )
                sms_sent = True
                print(f"SMS sent successfully: {message.sid}")
        except Exception as e:
            print(f"Failed to send SMS: {str(e)}")
            # Don't fail the API call if SMS fails
    
    return VideoCallResponse(
        success=True,
        sessionId=session_id,
        roomName=room_name,
        roomUrl=moderator_url,
        patientUrl=patient_url,
        moderatorToken=moderator_token,
        patientToken=patient_token,
        smsSent=sms_sent,
        message="Video call session created successfully"
    )

@router.get("/video-call/status/{session_id}", response_model=VideoCallStatusResponse)
async def get_video_call_status(
    session_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Get the status of a video call session"""
    
    result = await session.execute(
        select(Meeting).where(Meeting.session_id == session_id)
    )
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video call session not found"
        )
    
    return VideoCallStatusResponse(
        sessionId=session_id,
        status=meeting.status,
        roomName=meeting.room_name,
        createdAt=meeting.created_at,
        patientName=meeting.patient_name,
        procedure=meeting.procedure
    )

@router.post("/video-call/complete/{session_id}")
async def complete_video_call(
    session_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Mark a video call session as completed"""
    
    result = await session.execute(
        select(Meeting).where(Meeting.session_id == session_id)
    )
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video call session not found"
        )
    
    # Update meeting status
    await session.execute(
        update(Meeting)
        .where(Meeting.session_id == session_id)
        .values(status="completed")
    )
    await session.commit()
    
    return {"message": "Video call marked as completed", "sessionId": session_id}

@router.post("/video-call/start/{session_id}")
async def start_video_call(
    session_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Mark a video call session as active/started"""
    
    result = await session.execute(
        select(Meeting).where(Meeting.session_id == session_id)
    )
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video call session not found"
        )
    
    # Update meeting status
    await session.execute(
        update(Meeting)
        .where(Meeting.session_id == session_id)
        .values(status="active")
    )
    await session.commit()
    
    return {"message": "Video call started", "sessionId": session_id}
