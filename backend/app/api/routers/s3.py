import json
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Form
from fastapi.responses import JSONResponse
from app.services.s3 import upload_fileobj_to_s3, s3_key_for_recording, s3_key_for_claim_file, generate_s3_url
import os
import tempfile

router = APIRouter(prefix="/s3", tags=["s3"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), claim_id: str = Form(None)):
    """
    Upload a file to S3 and return the URL
    If claim_id is provided, files are organized in claim_id folders
    Uses direct streaming upload to S3 without temporary files
    """
    try:
        # Generate S3 key based on whether claim_id is provided
        if claim_id:
            s3_key = s3_key_for_claim_file(claim_id, file.filename)
        else:
            s3_key = s3_key_for_recording(file.filename)
        
        # Upload file stream directly to S3
        s3_url = upload_fileobj_to_s3(file.file, s3_key, file.content_type)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "File uploaded successfully",
                "url": s3_url,
                "key": s3_key,
                "filename": file.filename,
                "claim_id": claim_id
            }
        )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )
