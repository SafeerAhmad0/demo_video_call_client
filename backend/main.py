from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
import uvicorn
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Import app modules
from app.core.config import settings
from app.db.session import get_session, engine
from app.db.models import Base
from app.api.routers import forms, meetings, recordings, claims, s3

# Import authentication modules
from app.auth import router as auth_router

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="VerifyCall API",
    description="FastAPI backend for VerifyCall video verification application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:80",
        "http://localhost:5000",
        "https://localhost:8000",
        "https://localhost:8443"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(claims.router, prefix="/api")
app.include_router(forms.router, prefix="/api")
app.include_router(meetings.router, prefix="/api")
app.include_router(recordings.router, prefix="/api")
app.include_router(s3.router, prefix="/api")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "OK",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": "VerifyCall API is running"
    }

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to VerifyCall FastAPI Backend"}

# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Database initialization
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        reload=True
    )
