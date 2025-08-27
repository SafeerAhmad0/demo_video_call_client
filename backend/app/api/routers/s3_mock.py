import json
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from app.services.s3_mock import upload_file_to_s3, s3_key_for_recording, s3_key_for_claim_file, generate_s3_url
import os
import tempfile

router = APIRouter(prefix="/s3-mock", tags=["s3-mock"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), claim_id: str = None):
    """
    Mock upload a file to S3 and return the URL
    If claim_id is provided, files are organized in claim_id folders
    """
    try:
        # Create a temporary file to store the uploaded content
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Generate S3 key based on whether claim_id is provided
            if claim_id:
                s3_key = s3_key_for_claim_file(claim_id, file.filename)
            else:
                s3_key = s3_key_for_recording(file.filename)
            
            # Upload to mock S3
            s3_url = upload_file_to_s3(temp_file_path, s3_key, file.content_type)
            
            return JSONResponse(
                status_code=200,
                content={
                    "message": "File uploaded successfully (mock)",
                    "url": s3_url,
                    "key": s3_key,
                    "filename": file.filename,
                    "claim_id": claim_id
                }
            )
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )
