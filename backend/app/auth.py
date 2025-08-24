from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

from app.db.session import get_session
from app.db.models import User
from app.db.schemas import UserCreate, UserLogin, UserResponse, AuthResponse

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

router = APIRouter(prefix="/auth", tags=["authentication"])

# Utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(request: Request, session: AsyncSession = Depends(get_session)):
    # Get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    # Get user from database
    result = await session.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

@router.post("/register", response_model=AuthResponse)
async def register(user: UserCreate, response: Response, session: AsyncSession = Depends(get_session)):
    # Check if user already exists
    result = await session.execute(select(User).where(User.email == user.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Validate password
    if len(user.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    stmt = insert(User).values(
        email=user.email,
        password=hashed_password
    ).returning(User.id, User.email)
    
    result = await session.execute(stmt)
    new_user = result.fetchone()
    await session.commit()
    
    # Generate token
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    # Set cookie (for automatic browser handling)
    response.set_cookie(
        key="accessToken",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production
        samesite="strict",
        max_age=3600  # 1 hour
    )
    
    return {
        "message": "User created successfully",
        "user": {"id": new_user.id, "email": new_user.email},
        "access_token": access_token  # Also return in response for frontend storage
    }

@router.post("/login", response_model=AuthResponse)
async def login(user: UserLogin, response: Response, session: AsyncSession = Depends(get_session)):
    # Find user
    result = await session.execute(select(User).where(User.email == user.email))
    db_user = result.scalar_one_or_none()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Generate token
    access_token = create_access_token(data={"sub": str(db_user.id)})
    
    # Set cookie (for automatic browser handling)
    response.set_cookie(
        key="accessToken",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production
        samesite="strict",
        max_age=3600  # 1 hour
    )
    
    return {
        "message": "Login successful",
        "user": {"id": db_user.id, "email": db_user.email},
        "access_token": access_token  # Also return in response for frontend storage
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("accessToken")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email}
