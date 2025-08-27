from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Authentication schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str

class AuthResponse(BaseModel):
    message: str
    user: UserResponse
    access_token: str

# Claims schemas
class ClaimCreate(BaseModel):
    claim_number: str
    patient_mobile: str
    hospital_city: str
    hospital_state: str
    language: str

class ClaimResponse(BaseModel):
    id: int
    claim_number: str
    patient_mobile: str
    hospital_city: str
    hospital_state: str
    language: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Form schemas
class FormIn(BaseModel):
    full_name: str
    email: EmailStr
    notes: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    geo_accuracy_m: float | None = None

class FormOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    notes: str | None
    latitude: float | None
    longitude: float | None
    geo_accuracy_m: float | None
    captured_at: datetime

    class Config:
        from_attributes = True

# Meeting schemas
class NewRoomOut(BaseModel):
    roomName: str
    domain: str
    jwt: str | None = None

class MeetingRequest(BaseModel):
    claim_id: str
    patient_name: str
    procedure: str

class MeetingResponse(BaseModel):
    success: bool
    session_id: str
    room_url: str
    message: str | None = None

# Video Call schemas
class VideoCallRequest(BaseModel):
    claimId: str
    patientName: Optional[str] = None
    procedure: Optional[str] = None

class VideoCallResponse(BaseModel):
    success: bool
    sessionId: str
    roomName: str
    roomUrl: str
    patientUrl: str
    moderatorToken: Optional[str] = None
    patientToken: Optional[str] = None
    smsSent: bool = False
    message: str

class VideoCallStatusResponse(BaseModel):
    sessionId: str
    status: str
    roomName: str
    createdAt: datetime
    patientName: Optional[str] = None
    procedure: Optional[str] = None

# Recording schemas
class RecordingWebhookRequest(BaseModel):
    room_name: str
    s3_key: Optional[str] = None
    duration_sec: Optional[int] = None

class RecordingResponse(BaseModel):
    id: int
    meeting_id: Optional[int] = None
    s3_key: str
    s3_url: Optional[str] = None
    mime_type: str
    duration_sec: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geo_accuracy_m: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Email schemas
class EmailRequest(BaseModel):
    to: EmailStr | None = None  # override default EMAIL_TO if needed
