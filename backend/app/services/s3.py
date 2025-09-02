import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from app.core.config import settings
from datetime import datetime
import os
import logging
import json

logger = logging.getLogger(__name__)

def get_s3():
    """Get S3 client with proper configuration"""
    if not all([settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY, settings.AWS_REGION]):
        raise ValueError("AWS credentials not properly configured")

    logger.info(f"Creating S3 client for region: {settings.AWS_REGION}, bucket: {settings.S3_BUCKET}")
    try:
        s3_client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
        logger.info("S3 client created successfully")
        return s3_client
    except Exception as e:
        logger.error(f"Failed to create S3 client: {str(e)}")
        raise

def s3_key_for_recording(filename: str) -> str:
    """Generate S3 key for recording file"""
    ts = datetime.utcnow().strftime("%Y/%m/%d/%H%M%S")
    # Clean filename to avoid issues
    clean_filename = filename.replace(" ", "_").replace("(", "").replace(")", "")
    return f"{settings.S3_PREFIX}{ts}-{clean_filename}"

def s3_key_for_claim_file(claim_id: str, filename: str) -> str:
    """Generate S3 key for claim file using claim ID as folder and filename as object name"""
    # Clean filename to avoid issues
    clean_filename = filename.replace(" ", "_").replace("(", "").replace(")", "")
    # Sanitize claim_id to replace slashes with underscores to avoid S3 path issues
    clean_claim_id = claim_id.replace("/", "_").replace("\\", "_")
    logger.info(f"Generated S3 key for claim {claim_id} -> {clean_claim_id}/{clean_filename}")
    # Use sanitized claim ID as folder and filename as object name
    return f"{clean_claim_id}/{clean_filename}"

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

def ensure_bucket_exists(s3_client, bucket_name: str) -> None:
    """Ensure the S3 bucket exists, create it if it doesn't"""
    try:
        # Check if bucket exists
        s3_client.head_bucket(Bucket=bucket_name)
        logger.info(f"Bucket '{bucket_name}' exists")
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == '404' or error_code == 'NoSuchBucket':
            logger.info(f"Bucket '{bucket_name}' does not exist, attempting to create it...")
            try:
                # Create the bucket
                if settings.AWS_REGION == 'us-east-1':
                    s3_client.create_bucket(Bucket=bucket_name)
                else:
                    s3_client.create_bucket(
                        Bucket=bucket_name,
                        CreateBucketConfiguration={
                            'LocationConstraint': settings.AWS_REGION
                        }
                    )
                logger.info(f"Successfully created bucket '{bucket_name}'")

                # Set public read policy for the bucket
                try:
                    bucket_policy = {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": "*",
                                "Action": [
                                    "s3:GetObject",
                                    "s3:GetObjectVersion"
                                ],
                                "Resource": f"arn:aws:s3:::{bucket_name}/*"
                            }
                        ]
                    }

                    s3_client.put_bucket_policy(
                        Bucket=bucket_name,
                        Policy=json.dumps(bucket_policy)
                    )
                    logger.info(f"Set public read policy on bucket '{bucket_name}'")
                except Exception as policy_error:
                    logger.warning(f"Could not set bucket policy: {policy_error}")

            except Exception as create_error:
                logger.error(f"Failed to create bucket '{bucket_name}': {create_error}")
                raise Exception(f"Bucket '{bucket_name}' does not exist and could not be created. Please create it manually or check IAM permissions.")
        else:
            # Re-raise other errors
            raise

def upload_file_to_s3(file_path: str, s3_key: str, content_type: str = None) -> str:
    """Upload a file to S3 and return the URL"""
    try:
        logger.info(f"Uploading file {file_path} to S3 bucket {settings.S3_BUCKET} with key {s3_key}")
        # Create an S3 client using credentials (matching the sample script pattern)
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )

        # Ensure bucket exists before uploading
        ensure_bucket_exists(s3, settings.S3_BUCKET)

        # Upload the file (matching the sample script pattern)
        s3.upload_file(file_path, settings.S3_BUCKET, s3_key)
        logger.info(f"Successfully uploaded file to S3: {s3_key}")

        # Generate and return the S3 URL
        return generate_s3_url(s3_key)

    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        logger.error(f"S3 ClientError uploading file {file_path} to bucket {settings.S3_BUCKET} with key {s3_key}: {error_code} - {error_message}")
        raise Exception(f"S3 Error uploading file: {error_code} - {error_message}")
    except Exception as e:
        logger.error(f"Unexpected error uploading file {file_path} to S3: {str(e)}")
        raise Exception(f"Error uploading file: {e}")

def upload_fileobj_to_s3(file_obj, s3_key: str, content_type: str = None) -> str:
    """Upload a file-like object to S3 and return the URL"""
    try:
        logger.info(f"Uploading file object to S3 bucket {settings.S3_BUCKET} with key {s3_key}")
        # Create an S3 client using credentials
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )

        # Ensure bucket exists before uploading
        ensure_bucket_exists(s3, settings.S3_BUCKET)

        # Upload the file object
        extra_args = {}
        if content_type:
            extra_args['ContentType'] = content_type

        s3.upload_fileobj(file_obj, settings.S3_BUCKET, s3_key, ExtraArgs=extra_args)
        logger.info(f"Successfully uploaded file object to S3: {s3_key}")

        # Generate and return the S3 URL
        return generate_s3_url(s3_key)

    except Exception as e:
        logger.error(f"Error uploading file object to S3: {str(e)}")
        raise Exception(f"Error uploading file object: {e}")

def delete_s3_object(s3_key: str) -> bool:
    """Delete an object from S3"""
    try:
        logger.info(f"Deleting S3 object: {s3_key}")
        s3_client = get_s3()
        s3_client.delete_object(Bucket=settings.S3_BUCKET, Key=s3_key)
        logger.info(f"Successfully deleted S3 object: {s3_key}")
        return True
    except ClientError as e:
        logger.error(f"Error deleting S3 object {s3_key}: {str(e)}")
        return False

def check_s3_object_exists(s3_key: str) -> bool:
    """Check if an object exists in S3"""
    try:
        logger.debug(f"Checking if S3 object exists: {s3_key}")
        s3_client = get_s3()
        s3_client.head_object(Bucket=settings.S3_BUCKET, Key=s3_key)
        logger.debug(f"S3 object exists: {s3_key}")
        return True
    except ClientError as e:
        logger.debug(f"S3 object does not exist: {s3_key}")
        return False
