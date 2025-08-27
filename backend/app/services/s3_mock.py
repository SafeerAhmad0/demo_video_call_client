"""Mock S3 service for testing purposes"""
import os
from datetime import datetime
from app.core.config import settings
from typing import Optional

def s3_key_for_recording(filename: str) -> str:
    """Generate S3 key for recording file"""
    ts = datetime.utcnow().strftime("%Y/%m/%d/%H%M%S")
    # Clean filename to avoid issues
    clean_filename = filename.replace(" ", "_").replace("(", "").replace(")", "")
    return f"{settings.S3_PREFIX}{ts}-{clean_filename}"

def s3_key_for_claim_file(claim_id: str, filename: str) -> str:
    """Generate S3 key for claim file with claim ID folder structure"""
    # Clean filename to avoid issues
    clean_filename = filename.replace(" ", "_").replace("(", "").replace(")", "")
    return f"{settings.S3_PREFIX}{claim_id}/{clean_filename}"

def generate_s3_url(s3_key: str) -> str:
    """Generate mock S3 URL for a given key"""
    return f"https://mock-s3.example.com/{s3_key}"

def upload_file_to_s3(file_path: str, s3_key: str, content_type: str = None) -> str:
    """Mock file upload to S3 - simulates the upload process"""
    try:
        # Simulate file upload by checking if file exists locally
        if not os.path.exists(file_path):
            raise Exception(f"File {file_path} does not exist")
        
        # Get file size to simulate upload progress
        file_size = os.path.getsize(file_path)
        
        # Simulate upload delay based on file size
        print(f"Mock upload: Uploading {file_size} bytes to S3 key: {s3_key}")
        
        # Return mock URL
        return generate_s3_url(s3_key)
        
    except Exception as e:
        raise Exception(f"Mock upload error: {str(e)}")

def delete_s3_object(s3_key: str) -> bool:
    """Mock delete operation - always returns success"""
    print(f"Mock delete: Deleting S3 object: {s3_key}")
    return True

def check_s3_object_exists(s3_key: str) -> bool:
    """Mock existence check - always returns True for testing"""
    return True
