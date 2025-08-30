#!/usr/bin/env python3
"""
Simple script to check if S3 bucket exists and provide manual creation instructions
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

def check_bucket_exists():
    """Check if the S3 bucket exists"""
    try:
        s3_client = get_s3()
        bucket_name = settings.S3_BUCKET
        
        try:
            s3_client.head_bucket(Bucket=bucket_name)
            print(f"✅ Bucket '{bucket_name}' exists!")
            return True
        except Exception:
            print(f"❌ Bucket '{bucket_name}' does not exist")
            return False
            
    except Exception as e:
        print(f"❌ Error checking bucket: {e}")
        return False

if __name__ == "__main__":
    print("S3 Bucket Check Script")
    print("=" * 40)
    
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
    
    # Check if bucket exists
    exists = check_bucket_exists()
    
    if not exists:
        print("\n" + "=" * 60)
        print("MANUAL BUCKET CREATION INSTRUCTIONS:")
        print("=" * 60)
        print("1. Log in to AWS Console: https://console.aws.amazon.com")
        print("2. Go to S3 service")
        print("3. Click 'Create bucket'")
        print(f"4. Bucket name: {settings.S3_BUCKET}")
        print(f"5. AWS Region: {settings.AWS_REGION}")
        print("6. Keep all other settings as default")
        print("7. Click 'Create bucket'")
        print("\n8. After creation, set bucket permissions:")
        print("   - Go to bucket -> Permissions -> Bucket Policy")
        print("   - Use this policy (replace BUCKET_NAME):")
        print(f"""
{{
    "Version": "2012-10-17",
    "Statement": [
        {{
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource": "arn:aws:s3:::BUCKET_NAME/*"
        }}
    ]
}}
""")
        print("9. Save the policy")
        print("\n10. Test the application again")
    else:
        print("\n🎉 Bucket exists! The application should work now.")
