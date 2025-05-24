from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Crypto Exchange API"
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/crypto_exchange")
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # WordPress API Configuration
    WP_API_URL: str = os.getenv("WP_API_URL", "")
    WP_API_KEY: str = os.getenv("WP_API_KEY", "")
    
    # Telegram Bot Configuration
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    
    # Exchange Rate Update Interval (in minutes)
    RATE_UPDATE_INTERVAL: int = 5
    
    # Supported Currencies
    FIAT_CURRENCIES: list = ["USD", "EUR", "RUB"]
    CRYPTO_CURRENCIES: list = ["BTC", "ETH", "USDT"]
    
    class Config:
        case_sensitive = True

settings = Settings() 