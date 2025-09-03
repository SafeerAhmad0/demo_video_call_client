from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.auth import get_current_user
import jwt
import uuid
import time
import base64

router = APIRouter(prefix="/jaas", tags=["jaas"])

def generate_jwt(user_name: str, user_email: str, room_name: str, avatar_url: str = "") -> str:
    """
    Generate a JaaS JWT token using the user's information
    """
    try:
        # Get the private key and app ID from settings
        if not settings.JAAS_PRIVATE_KEY or not settings.JAAS_APP_ID or not settings.JAAS_API_KEY_ID:
            raise ValueError("Missing JaaS configuration. Check JAAS_PRIVATE_KEY, JAAS_APP_ID, and JAAS_API_KEY_ID")

        # Create payload with all required claims
        now = int(time.time())
        
        payload = {
            "aud": "jitsi",  # Constant audience for JaaS
            "iss": "chat",   # Our issuer name
            "sub": settings.JAAS_APP_ID,  # App ID from 8x8
            "room": room_name,  # Room name
            "exp": now + 3600,  # 1 hour from now
            "nbf": now - 10,    # Valid from 10 seconds ago (clock skew)
            "context": {
                "user": {
                    "id": str(uuid.uuid4()),  # Generate unique user ID
                    "name": user_name,
                    "email": user_email,
                    "avatar": avatar_url,
                    "moderator": True
                },
                "features": {
                    "recording": True,
                    "livestreaming": True,
                    "transcription": True,
                    "outbound-call": True
                }
            }
        }

        # JWT headers
        headers = {
            "kid": settings.JAAS_API_KEY_ID,  # API Key ID from 8x8
            "typ": "JWT",
            "alg": "RS256"
        }

        # Generate token with RS256 algorithm
        token = jwt.encode(
            payload,
            base64.b64decode(settings.JAAS_PRIVATE_KEY),  # Decode base64 private key
            algorithm="RS256",
            headers=headers
        )

        return token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate JWT: {str(e)}"
        )

@router.post("/token")
async def get_jaas_token(
    room: str = Body(..., description="Room name"),
    user_name: str = Body(..., description="User's display name"),
    email: str = Body(..., description="User's email"),
    avatar: str = Body("", description="User's avatar URL"),
    current_user=Depends(get_current_user)
):
    """Generate a JaaS JWT token for 8x8 video meetings"""
    try:
        token = generate_jwt(user_name, email, room, avatar)
        return JSONResponse(content={
            "token": token,
            "appId": settings.JAAS_APP_ID,
            "roomName": room
        })
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
