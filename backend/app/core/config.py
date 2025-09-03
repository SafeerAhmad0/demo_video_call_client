from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "video-app"
    API_PREFIX: str = "/api"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    # Database URL - read from environment variable, fallback to SQLite for development
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

    # JWT Settings
    jwt_secret: str = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-this")

    # Twilio Settings
    twilio_account_sid: str = os.getenv("TWILIO_ACCOUNT_SID", "your-twilio-account-sid")
    twilio_auth_token: str = os.getenv("TWILIO_AUTH_TOKEN", "your-twilio-auth-token")
    twilio_phone_number: str = os.getenv("TWILIO_PHONE_NUMBER", "+1234567890")

    # Server Settings
    port: str = os.getenv("PORT", "8000")

    SMTP_HOST: str | None = os.getenv("SMTP_HOST")
    SMTP_PORT: int | None = int(os.getenv("SMTP_PORT")) if os.getenv("SMTP_PORT") else None
    SMTP_USER: str | None = os.getenv("SMTP_USER")
    SMTP_PASSWORD: str | None = os.getenv("SMTP_PASSWORD")
    EMAIL_FROM: str | None = os.getenv("EMAIL_FROM")
    EMAIL_TO: str | None = os.getenv("EMAIL_TO")

    # JaaS Settings
    JAAS_APP_ID: str = os.getenv("JAAS_APP_ID", "")
    JAAS_API_KEY_ID: str = os.getenv("JAAS_API_KEY_ID", "")
    JAAS_PRIVATE_KEY: str = os.getenv("JAAS_PRIVATE_KEY", "")  # This will be the secret key for HS256

    AWS_ACCESS_KEY_ID: str | None = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str | None = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str | None = os.getenv("AWS_REGION")
    S3_BUCKET: str | None = os.getenv("S3_BUCKET")
    S3_PREFIX: str = os.getenv("S3_PREFIX") or ""

    JITSI_APP_ID: str | None = os.getenv("JITSI_APP_ID")
    JITSI_APP_SECRET: str | None = os.getenv("JITSI_APP_SECRET")
    JITSI_RSA_PRIVATE_KEY: str | None = os.getenv("JITSI_RSA_PRIVATE_KEY")
    JITSI_DOMAIN: str = os.getenv("JITSI_DOMAIN", "meet.jit.si")
    # JAAS API Key ID (kid) for JWT header
    JITSI_API_KEY_ID: str | None = os.getenv("JITSI_API_KEY_ID")

    # Additional Jitsi/Docker configuration fields
    postgres_db: str | None = os.getenv("POSTGRES_DB")
    postgres_user: str | None = os.getenv("POSTGRES_USER")
    postgres_password: str | None = os.getenv("POSTGRES_PASSWORD")
    react_app_api_url: str | None = os.getenv("REACT_APP_API_URL")
    config: str | None = os.getenv("CONFIG")
    tz: str | None = os.getenv("TZ")
    http_port: str | None = os.getenv("HTTP_PORT")
    https_port: str | None = os.getenv("HTTPS_PORT")
    jwt_app_id: str | None = os.getenv("JWT_APP_ID")
    jwt_app_secret: str | None = os.getenv("JWT_APP_SECRET")
    jicofo_component_secret: str | None = os.getenv("JICOFO_COMPONENT_SECRET")
    jvb_auth_user: str | None = os.getenv("JVB_AUTH_USER")
    jvb_auth_password: str | None = os.getenv("JVB_AUTH_PASSWORD")
    enable_auth: str | None = os.getenv("ENABLE_AUTH")
    enable_guests: str | None = os.getenv("ENABLE_GUESTS")
    auth_type: str | None = os.getenv("AUTH_TYPE")
    docker_host_address: str | None = os.getenv("DOCKER_HOST_ADDRESS")
    public_url: str | None = os.getenv("PUBLIC_URL")

    class Config:
        env_file = ".env"
        extra = "ignore"  # Allow extra fields without validation errors

settings = Settings()
