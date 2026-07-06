import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field
from dotenv import load_dotenv

# Load environment variables from .env or .env.local in current or parent directories
env_paths = [
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent.parent / ".env.local",
    Path(__file__).resolve().parent.parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent / ".env.local",
]

for path in env_paths:
    if path.exists():
        load_dotenv(path)
        break

class Settings(BaseSettings):
    DATABASE_URL: str = Field(default="")
    CLOUDINARY_CLOUD_NAME: str = Field(default="")
    CLOUDINARY_API_KEY: str = Field(default="")
    CLOUDINARY_API_SECRET: str = Field(default="")
    
    class Config:
        extra = "ignore"

settings = Settings()
