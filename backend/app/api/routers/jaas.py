from fastapi import APIRouter, Query, Depends, HTTPException, status
from app.core.config import settings
from jose import jwt
import time
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from app.auth import get_current_user  # Assuming you have auth dependency

router = APIRouter(prefix="/jaas", tags=["jaas"])

def generate_8x8_jwt(room: str, user_name: str, moderator: bool = True):
    """Generate JWT token for 8x8 cloud provider using RSA private key"""
    now = int(time.time())
    exp = now + 60 * 60  # valid for 1 hour

    if not settings.JITSI_APP_ID or not settings.JITSI_RSA_PRIVATE_KEY:
        raise ValueError("8x8 App ID or RSA Private Key not configured")

    payload = {
        "aud": "jitsi",
        "iss": "chat",
        "sub": settings.JITSI_APP_ID,
        "room": room,
        "exp": exp,
        "nbf": now,
        "context": {
            "user": {
                "name": user_name,
                "moderator": moderator,
            }
        }
    }

    # Load RSA private key
    try:
        private_key_pem = base64.b64decode(settings.JITSI_RSA_PRIVATE_KEY)
        private_key = serialization.load_pem_private_key(
            private_key_pem,
            password=None
        )

        if not isinstance(private_key, rsa.RSAPrivateKey):
            raise ValueError("Invalid RSA private key")

        token = jwt.encode(
            payload,
            private_key,
            algorithm="RS256"
        )
        return token
    except Exception as e:
        raise ValueError(f"Failed to generate JWT with RSA key: {str(e)}")

def generate_jaas_jwt(room: str, user_name: str, moderator: bool = True):
    """Generate JWT token for standard JAAS using HMAC-SHA256"""
    now = int(time.time())
    exp = now + 60 * 60  # valid for 1 hour

    if not settings.JITSI_APP_ID or not settings.JITSI_APP_SECRET:
        raise ValueError("JAAS App ID or Secret not configured")

    payload = {
        "aud": "jitsi",
        "iss": "chat",
        "sub": settings.JITSI_APP_ID,
        "room": room,
        "exp": exp,
        "nbf": now,
        "context": {
            "user": {
                "name": user_name,
                "moderator": moderator,
            }
        }
    }

    token = jwt.encode(
        payload,
        settings.JITSI_APP_SECRET,
        algorithm="HS256"
    )
    return token

@router.get("/token")
async def get_jaas_token(
    room: str = Query(..., description="Room name"),
    user: str = Query(..., description="User name"),
    current_user=Depends(get_current_user)  # Protect endpoint
):
    try:
        token = generate_jaas_jwt(room, user)
        return {"token": token}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/8x8-token")
async def get_8x8_token(
    room: str = Query(..., description="Room name"),
    user: str = Query(..., description="User name"),
    moderator: bool = Query(True, description="Whether user is moderator"),
    current_user=Depends(get_current_user)  # Protect endpoint
):
    try:
        token = generate_8x8_jwt(room, user, moderator)
        return {"token": token}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
