from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, select
from typing import Dict, Any
from pydantic import BaseModel, EmailStr

from app.db.session import get_session
from app.db import models
from app.db.schemas import FormIn, FormOut, EmailRequest
from app.services.pdf import generate_submissions_pdf
from app.services.emailer import send_email_with_attachment
from app.services.report import create_report_service
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/forms", tags=["forms"])

# Additional schemas for report generation
class ReportGenerationRequest(BaseModel):
    claim_id: int
    recipient_email: EmailStr
    form_data: Dict[str, Any] = {}

class FormSubmissionRequest(BaseModel):
    session_id: str
    full_name: str
    email: EmailStr
    phone: str
    policy_number: str = ""
    message: str = ""

@router.post("", status_code=201)
async def create_form(payload: FormIn, session: AsyncSession = Depends(get_session)):
    stmt = insert(models.FormSubmission).values(
        full_name=payload.full_name,
        email=payload.email,
        notes=payload.notes,
        latitude=payload.latitude,
        longitude=payload.longitude,
        geo_accuracy_m=payload.geo_accuracy_m,
    ).returning(models.FormSubmission.id)
    res = await session.execute(stmt)
    new_id = res.scalar_one()
    await session.commit()
    return {"ok": True, "id": new_id}

@router.get("", response_model=list[FormOut])
async def list_forms(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(models.FormSubmission).order_by(models.FormSubmission.id))
    items = result.scalars().all()
    return items

@router.get("/pdf")
async def download_pdf(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(models.FormSubmission))
    items = result.scalars().all()
    data = [
        {
            "id": x.id,
            "full_name": x.full_name,
            "email": x.email,
            "notes": x.notes,
            "latitude": x.latitude,
            "longitude": x.longitude,
            "geo_accuracy_m": x.geo_accuracy_m,
            "captured_at": x.captured_at.isoformat(),
        }
        for x in items
    ]
    pdf_buf = generate_submissions_pdf(data)
    return StreamingResponse(pdf_buf, media_type="application/pdf",
                             headers={"Content-Disposition":"attachment; filename=submissions.pdf"})

@router.post("/send-email")
async def send_email(body: EmailRequest | None = None, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(models.FormSubmission))
    items = result.scalars().all()
    data = [
        {
            "id": x.id,
            "full_name": x.full_name,
            "email": x.email,
            "notes": x.notes,
            "latitude": x.latitude,
            "longitude": x.longitude,
            "geo_accuracy_m": x.geo_accuracy_m,
            "captured_at": x.captured_at.isoformat(),
        }
        for x in items
    ]
    pdf_buf = generate_submissions_pdf(data)
    send_email_with_attachment(
        subject="Form Submissions Report",
        body="Please find the attached report.",
        pdf_bytes=pdf_buf.read(),
        filename="submissions.pdf",
        to_override=body.to if body and body.to else None
    )
    return {"ok": True}

@router.post("/submit")
async def submit_form_data(
    form_data: FormSubmissionRequest,
    session: AsyncSession = Depends(get_session)
):
    """Submit form data and link it to a meeting session"""
    
    # Find the meeting by session_id
    result = await session.execute(
        select(models.Meeting).where(models.Meeting.session_id == form_data.session_id)
    )
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting session not found"
        )
    
    # Create form submission
    stmt = insert(models.FormSubmission).values(
        full_name=form_data.full_name,
        email=form_data.email,
        notes=f"Phone: {form_data.phone}\nPolicy: {form_data.policy_number}\nMessage: {form_data.message}",
        claim_id=meeting.claim_id
    ).returning(models.FormSubmission.id)
    
    result = await session.execute(stmt)
    form_id = result.scalar_one()
    await session.commit()
    
    return {
        "success": True,
        "form_id": form_id,
        "session_id": form_data.session_id,
        "message": "Form data submitted successfully"
    }

@router.post("/generate-report")
async def generate_claim_report(
    request: ReportGenerationRequest,
    session: AsyncSession = Depends(get_session)
):
    """Generate and send claim verification report"""
    
    try:
        report_service = await create_report_service(session)
        result = await report_service.generate_and_send_claim_report(
            claim_id=request.claim_id,
            recipient_email=request.recipient_email,
            form_data=request.form_data
        )
        
        if result['success']:
            return result
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get('message', 'Failed to generate report')
            )
            
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/claim-summary/{claim_id}")
async def get_claim_summary(
    claim_id: int,
    session: AsyncSession = Depends(get_session)
):
    """Get comprehensive summary of claim verification status"""
    
    try:
        report_service = await create_report_service(session)
        result = await report_service.get_claim_summary(claim_id)
        
        if result['success']:
            return result
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result.get('error', 'Claim not found')
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
