from sqlalchemy.orm import declarative_base, Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Integer, DateTime, Float, ForeignKey
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Claim(Base):
    __tablename__ = "claims"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    claim_number: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    patient_mobile: Mapped[str] = mapped_column(String(20))
    hospital_city: Mapped[str] = mapped_column(String(100))
    hospital_state: Mapped[str] = mapped_column(String(10))
    language: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(20), default="open")
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user: Mapped[User] = relationship("User")
    meetings: Mapped[list["Meeting"]] = relationship("Meeting", back_populates="claim")

class FormSubmission(Base):
    __tablename__ = "form_submissions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Geo fields (from client)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    geo_accuracy_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Link to claim
    claim_id: Mapped[int | None] = mapped_column(ForeignKey("claims.id"), nullable=True)
    claim: Mapped[Claim | None] = relationship("Claim")

class Meeting(Base):
    __tablename__ = "meetings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    session_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    claim_id: Mapped[int | None] = mapped_column(ForeignKey("claims.id"), nullable=True)
    patient_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    procedure: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, active, completed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    claim: Mapped[Claim | None] = relationship("Claim", back_populates="meetings")
    recordings: Mapped[list["Recording"]] = relationship("Recording", back_populates="meeting")

class Recording(Base):
    __tablename__ = "recordings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meeting_id: Mapped[int | None] = mapped_column(ForeignKey("meetings.id"), nullable=True)
    s3_key: Mapped[str] = mapped_column(String(512))
    s3_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    mime_type: Mapped[str] = mapped_column(String(120))
    duration_sec: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Geo snapshot at start of recording (optional)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    geo_accuracy_m: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    meeting: Mapped[Meeting | None] = relationship("Meeting", back_populates="recordings")
