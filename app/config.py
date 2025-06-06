"""Application configuration"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/homeverse"
    test_database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/homeverse_test"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT
    jwt_secret_key: str = "your-secret-key-here"
    access_token_expire_minutes: int = 30
    
    # External APIs
    openai_api_key: Optional[str] = None
    unstructured_api_key: Optional[str] = None
    sendgrid_api_key: Optional[str] = None
    
    # Supabase
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"
    sql_debug: bool = False
    
    # Email
    from_email: str = "noreply@homeverse.io"
    
    class Config:
        env_file = ".env"


settings = Settings()