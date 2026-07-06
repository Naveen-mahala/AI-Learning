from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Document Content schemas
class DocumentContentBase(BaseModel):
    raw_text: str
    word_count: int
    character_count: int

    class Config:
        from_attributes = True

class DocumentContentResponse(DocumentContentBase):
    id: int
    document_id: str
    created_at: datetime


# Processing Log schemas
class DocumentProcessingLogBase(BaseModel):
    status: str
    message: str

    class Config:
        from_attributes = True

class DocumentProcessingLogResponse(DocumentProcessingLogBase):
    id: int
    document_id: str
    created_at: datetime


# Document schemas
class DocumentBase(BaseModel):
    title: str
    filename: str
    cloudinary_url: str
    cloudinary_public_id: str
    file_size: int
    processing_status: str
    page_count: Optional[int] = None
    estimated_reading_time: Optional[int] = None

class DocumentCreate(DocumentBase):
    id: str

class DocumentResponse(DocumentBase):
    id: str
    word_count: Optional[int] = None
    character_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Extended schema to get detailed info of a document, including preview and logs
class DocumentDetailResponse(DocumentResponse):
    text_preview: Optional[str] = None
    logs: List[DocumentProcessingLogResponse] = []

# Schema specifically for the Upload response
class DocumentUploadResponse(BaseModel):
    success: bool
    document_id: str
    file_url: str
    pages: int
    words: int


class DocumentSummaryResponse(BaseModel):
    id: int
    document_id: str
    summary_json: dict
    learning_time: str
    generated_by_model: str
    created_at: datetime

    class Config:
        from_attributes = True

