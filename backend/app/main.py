import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import documents
from app.utils.logger import setup_logging

# Configure logging
setup_logging()
logger = logging.getLogger(__name__)

# Auto-create tables on startup (suitable for Neon DB setup)
try:
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database tables on startup: {str(e)}")

app = FastAPI(
    title="AI Learning Accelerator - Ingestion Pipeline Backend",
    description="Backend service for PDF upload, Cloudinary storage, text extraction and PostgreSQL ingestion.",
    version="1.0.0"
)

# Setup CORS middleware
# In development we allow all origins, in production we can restrict to front-end origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(documents.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AI Learning Accelerator - PDF Ingestion Pipeline Backend",
        "docs_url": "/docs"
    }
