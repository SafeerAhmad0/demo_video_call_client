from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update
from typing import Optional
import os

from app.db.session import get_session
from app.db import models
from app.services.s3 import get_s3, s3_key_for_recording, generate_s3_url
from app.core.config import settings
from app.db.schemas import RecordingWebhookRequest, RecordingResponse

router = APIRouter(prefix="/recordings", tags=["recordings"])

@router.post("/upload")
async def upload_recording(
    file: UploadFile = File(...),
    room_name: str = Form(...),
    duration_sec: int | None = Form(None),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    geo_accuracy_m: float | None = Form(None),
    session: AsyncSession = Depends(get_session),
):
    """Upload a recording file to S3 and store metadata in database"""
    
    # Find meeting by room name
    result = await session.execute(select(models.Meeting).where(models.Meeting.room_name == room_name))
    meeting = result.scalar_one_or_none()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found for the given room name"
        )

    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided"
        )

    # Generate S3 key and upload
    s3 = get_s3()
    key = s3_key_for_recording(file.filename)
    
    if not settings.S3_BUCKET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="S3 bucket not configured"
        )

    try:
        # Upload to S3
        s3.upload_fileobj(
            file.file, 
            settings.S3_BUCKET, 
            key, 
            ExtraArgs={
                "ContentType": file.content_type or "video/mp4",
                "Metadata": {
                    "room_name": room_name,
                    "meeting_id": str(meeting.id),
                    "uploaded_by": "verifycall_system"
                }
            }
        )
        
        # Generate public URL
        s3_url = generate_s3_url(key)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"S3 upload failed: {str(e)}"
        )

    # Store recording metadata in database
    stmt = insert(models.Recording).values(
        meeting_id=meeting.id,
        s3_key=key,
        s3_url=s3_url,
        mime_type=file.content_type or "video/mp4",
        duration_sec=duration_sec,
        latitude=latitude,
        longitude=longitude,
        geo_accuracy_m=geo_accuracy_m,
    ).returning(models.Recording.id)
    
    result = await session.execute(stmt)
    new_recording_id = result.scalar_one()
    await session.commit()

    return {
        "success": True, 
        "recording_id": new_recording_id, 
        "s3_key": key,
        "s3_url": s3_url,
        "message": "Recording uploaded successfully"
    }

@router.post("/webhook/jitsi")
async def jitsi_recording_webhook(
    webhook_data: RecordingWebhookRequest,
    session: AsyncSession = Depends(get_session)
):
    """Webhook endpoint for Jitsi recording completion notifications"""
    
    # Find meeting by room name
    result = await session.execute(
        select(models.Meeting).where(models.Meeting.room_name == webhook_data.room_name)
    )
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    # Generate S3 URL if S3 key provided
    s3_url = None
    if webhook_data.s3_key:
        s3_url = generate_s3_url(webhook_data.s3_key)
    
    # Create recording record
    stmt = insert(models.Recording).values(
        meeting_id=meeting.id,
        s3_key=webhook_data.s3_key,
        s3_url=s3_url,
        mime_type="video/mp4",
        duration_sec=webhook_data.duration_sec,
    ).returning(models.Recording.id)
    
    result = await session.execute(stmt)
    recording_id = result.scalar_one()
    
    # Update meeting status to completed
    await session.execute(
        update(models.Meeting)
        .where(models.Meeting.id == meeting.id)
        .values(status="completed")
    )
    
    await session.commit()
    
    return {
        "success": True,
        "recording_id": recording_id,
        "message": "Recording webhook processed successfully"
    }

@router.get("/meeting/{meeting_id}")
async def get_meeting_recordings(
    meeting_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get all recordings for a specific meeting"""
    
    result = await session.execute(
        select(models.Recording).where(models.Recording.meeting_id == meeting_id)
    )
    recordings = result.scalars().all()
    
    return {
        "meeting_id": meeting_id,
        "recordings": [
            {
                "id": rec.id,
                "s3_key": rec.s3_key,
                "s3_url": rec.s3_url,
                "duration_sec": rec.duration_sec,
                "created_at": rec.created_at,
                "mime_type": rec.mime_type
            }
            for rec in recordings
        ]
    }

@router.get("/{recording_id}", response_model=RecordingResponse)
async def get_recording(
    recording_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get a specific recording by ID"""
    
    result = await session.execute(
        select(models.Recording).where(models.Recording.id == recording_id)
    )
    recording = result.scalar_one_or_none()
    
    if not recording:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found"
        )
    
    return recording

@router.delete("/{recording_id}")
async def delete_recording(
    recording_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Delete a recording (from database and S3)"""
    
    # Get recording details
    result = await session.execute(
        select(models.Recording).where(models.Recording.id == recording_id)
    )
    recording = result.scalar_one_or_none()
    
    if not recording:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found"
        )
    
    # Delete from S3 if key exists
    if recording.s3_key and settings.S3_BUCKET:
        try:
            s3 = get_s3()
            s3.delete_object(Bucket=settings.S3_BUCKET, Key=recording.s3_key)
        except Exception as e:
            print(f"Failed to delete from S3: {str(e)}")
            # Continue with database deletion even if S3 deletion fails
    
    # Delete from database
    await session.execute(
        models.Recording.__table__.delete().where(models.Recording.id == recording_id)
    )
    await session.commit()
    
    return {"message": "Recording deleted successfully"}
