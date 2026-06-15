from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
import secrets


class Settings(BaseSettings):
    # Core
    environment: str = Field(default="development", description="development, staging, production")
    database_url: str = Field(default="postgresql://postgres:postgres@localhost:5432/servicemonks")
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32), description="JWT secret key - MUST be set in production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    # CORS and Security
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # SMTP Configuration
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = Field(default="", description="Must be set in production")
    smtp_password: str = Field(default="", description="Must be set in production")
    smtp_from_name: str = "Service Monks Integrated Solutions Private Limited"
    notification_email: str = ""   # internal SM inbox — all service sheets land here

    # API Configuration
    rate_per_km: float = 5.0
    max_signature_size_kb: int = 500  # ~375KB base64

    class Config:
        env_file = ".env"

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v: str, info):
        environment = info.data.get("environment", "development")
        if environment == "production":
            if not v or v == "change-this-secret-key-in-production" or len(v) < 32:
                raise ValueError("SECRET_KEY must be a long random string (min 32 chars) in production")
        return v

    @field_validator("smtp_password")
    @classmethod
    def validate_smtp_creds(cls, v: str, info):
        environment = info.data.get("environment", "development")
        if environment == "production":
            if not v:
                raise ValueError("SMTP_PASSWORD must be set in production")
        return v


settings = Settings()
