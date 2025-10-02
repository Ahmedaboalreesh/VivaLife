"""
Configuration settings for Wasfaty-POS Integration System
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Database Configuration
    database_url: str = "postgresql://username:password@localhost:5432/wasfaty_pos_db"
    
    # Security Configuration
    secret_key: str = "your-super-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Wasfaty API Configuration
    wasfaty_base_url: str = "https://api.wasfaty.sa"
    wasfaty_client_id: str = ""
    wasfaty_client_secret: str = ""
    wasfaty_api_version: str = "v1"
    
    # POS System Configuration
    pos_webhook_secret: str = "your-pos-webhook-secret"
    encryption_key: str = "your-32-byte-encryption-key"
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379/0"
    
    # Logging Configuration
    log_level: str = "INFO"
    log_file: str = "logs/wasfaty_pos.log"
    
    # Environment
    environment: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


# Database configuration
def get_database_url() -> str:
    """Get database URL with proper formatting"""
    return settings.database_url


# Wasfaty API configuration
def get_wasfaty_config() -> dict:
    """Get Wasfaty API configuration"""
    return {
        "base_url": settings.wasfaty_base_url,
        "client_id": settings.wasfaty_client_id,
        "client_secret": settings.wasfaty_client_secret,
        "api_version": settings.wasfaty_api_version
    }


# Security configuration
def get_security_config() -> dict:
    """Get security configuration"""
    return {
        "secret_key": settings.secret_key,
        "algorithm": settings.algorithm,
        "access_token_expire_minutes": settings.access_token_expire_minutes
    }
