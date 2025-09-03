from fastapi import APIRouter, Body, HTTPException
from fastapi import status
from jaas_jwt import generate
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/jaas-jwt", tags=["jaas-jwt"])

def generate_jwt(name: str, email: str) -> str:
    """Simple JWT generation for JaaS"""
    try:
        private_key = os.getenv('JAAS_PRIVATE_KEY')
        app_id = os.getenv('JAAS_APP_ID')
        kid = os.getenv('JAAS_KID')
        
        token = generate(private_key, {
            'id': str(uuid.uuid4()),
            'name': name,
            'email': email,
            'avatar': '',
            'appId': app_id,
            'kid': kid
        })
        
        return token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate JaaS JWT: {str(e)}"
        )

@router.post("/token")
async def get_jaas_token(
    name: str = Body(...),
    email: str = Body(...)
):
    """Generate a JaaS JWT token"""
    try:
        token = generate_jwt(name, email)
        return {
            "token": token,
            "appId": os.getenv('JAAS_APP_ID')
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
