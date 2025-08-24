import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from app.core.config import settings
from datetime import datetime
import os

def get_s3():
    """Get S3 client with proper configuration"""
    if not all([settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY, settings.AWS_REGION]):
        raise ValueError("AWS credentials not properly configured")
    
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )

def s3_key_for_recording(filename: str) -> str:
    """Generate S3 key for recording file"""
    ts = datetime.utcnow().strftime("%Y/%m/%d/%H%M%S")
    # Clean filename to avoid issues
    clean_filename = filename.replace(" ", "_").replace("(", "").replace(")", "")
    return f"{settings.S3_PREFIX}{ts}-{clean_filename}"

def generate_s3_url(s3_key: str) -> str:
    """Generate public S3 URL for a given key"""
    if not settings.S3_BUCKET:
        raise ValueError("S3 bucket not configured")
    
    # For public buckets, use direct URL
    region = settings.AWS_REGION or "us-east-1"
    if region == "us-east-1":
        return f"https://{settings.S3_BUCKET}.s3.amazonaws.com/{s3_key}"
    else:
        return f"https://{settings.S3_BUCKET}.s3.{region}.amazonaws.com/{s3_key}"

def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    """Generate a presigned URL for private S3 objects"""
    try:
        s3_client = get_s3()
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': settings.S3_BUCKET, 'Key': s3_key},
            ExpiresIn=expiration
        )
        return response
    except ClientError as e:
        raise Exception(f"Error generating presigned URL: {str(e)}")

def upload_file_to_s3(file_path: str, s3_key: str, content_type: str = None) -> str:
    """Upload a file to S3 and return the URL"""
    try:
        s3_client = get_s3()
        
        extra_args = {}
        if content_type:
            extra_args['ContentType'] = content_type
        
        s3_client.upload_file(file_path, settings.S3_BUCKET, s3_key, ExtraArgs=extra_args)
        return generate_s3_url(s3_key)
        
    except ClientError as e:
        raise Exception(f"Error uploading to S3: {str(e)}")

def delete_s3_object(s3_key: str) -> bool:
    """Delete an object from S3"""
    try:
        s3_client = get_s3()
        s3_client.delete_object(Bucket=settings.S3_BUCKET, Key=s3_key)
        return True
    except ClientError as e:
        print(f"Error deleting S3 object: {str(e)}")
        return False

def check_s3_object_exists(s3_key: str) -> bool:
    """Check if an object exists in S3"""
    try:
        s3_client = get_s3()
        s3_client.head_object(Bucket=settings.S3_BUCKET, Key=s3_key)
        return True
    except ClientError:
        return False
