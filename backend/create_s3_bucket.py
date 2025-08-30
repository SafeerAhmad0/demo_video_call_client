#!/usr/bin/env python3
"""
Script to create the S3 bucket if it doesn't exist
"""

import os
import sys
from pathlib import Path

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.services.s3 import get_s3
from app.core.config import settings

def create_s3_bucket():
    """Create the S3 bucket if it doesn't exist"""
    print("Checking S3 bucket status...")
    
    try:
        s3_client = get_s3()
        bucket_name = settings.S3_BUCKET
        
        # Check if bucket exists
        try:
            s3_client.head_bucket(Bucket=bucket_name)
            print(f"✅ Bucket '{bucket_name}' already exists")
            return True
        except Exception:
            # Bucket doesn't exist, let's create it
            print(f"⚠️  Bucket '{bucket_name}' does not exist")
            print(f"Creating bucket '{bucket_name}' in region '{settings.AWS_REGION}'...")
            
            try:
                if settings.AWS_REGION == 'us-east-1':
                    # us-east-1 is the default region and has special handling
                    s3_client.create_bucket(Bucket=bucket_name)
                else:
                    s3_client.create_bucket(
                        Bucket=bucket_name,
                        CreateBucketConfiguration={
                            'LocationConstraint': settings.AWS_REGION
                        }
                    )
                
                print(f"✅ Successfully created bucket '{bucket_name}'")
                
                # Set bucket policy to make it public (optional - adjust as needed)
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
                    print("✅ Set public read policy on bucket")
                except Exception as policy_error:
                    print(f"⚠️  Could not set bucket policy: {policy_error}")
                    print("You may need to set bucket permissions manually")
                
                return True
                
            except Exception as create_error:
                print(f"❌ Error creating bucket: {create_error}")
                print("\nYou may need to create the bucket manually:")
                print(f"1. Log in to AWS Console")
                print(f"2. Go to S3 service")
                print(f"3. Create bucket named: {bucket_name}")
                print(f"4. Region: {settings.AWS_REGION}")
                print(f"5. Set appropriate permissions")
                return False
                
    except Exception as e:
        print(f"❌ Error checking bucket: {e}")
        return False

def list_existing_buckets():
    """List all existing S3 buckets to help with troubleshooting"""
    print("\nListing existing S3 buckets...")
    
    try:
        s3_client = get_s3()
        response = s3_client.list_buckets()
        
        if response['Buckets']:
            print("Existing buckets:")
            for bucket in response['Buckets']:
                print(f"  - {bucket['Name']}")
        else:
            print("No buckets found in this AWS account")
            
    except Exception as e:
        print(f"Error listing buckets: {e}")

if __name__ == "__main__":
    print("S3 Bucket Setup Script")
    print("=" * 50)
    
    # Check if AWS credentials are configured
    if not all([settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY, settings.AWS_REGION, settings.S3_BUCKET]):
        print("❌ AWS credentials not fully configured")
        print(f"AWS_ACCESS_KEY_ID: {'Set' if settings.AWS_ACCESS_KEY_ID else 'Not set'}")
        print(f"AWS_SECRET_ACCESS_KEY: {'Set' if settings.AWS_SECRET_ACCESS_KEY else 'Not set'}")
        print(f"AWS_REGION: {settings.AWS_REGION}")
        print(f"S3_BUCKET: {settings.S3_BUCKET}")
        sys.exit(1)
    
    print("✅ AWS credentials configured")
    print(f"AWS Region: {settings.AWS_REGION}")
    print(f"S3 Bucket: {settings.S3_BUCKET}")
    print(f"S3 Prefix: {settings.S3_PREFIX}")
    
    # List existing buckets first
    list_existing_buckets()
    
    # Try to create the bucket
    success = create_s3_bucket()
    
    if success:
        print("\n🎉 S3 bucket setup completed!")
        print("You can now run the application and upload files to S3")
    else:
        print("\n❌ S3 bucket setup failed")
        print("Please create the bucket manually in AWS Console")
        sys.exit(1)
