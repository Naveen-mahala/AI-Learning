from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Document Content schemas
class DocumentContentBase(BaseModel):
    page_number: int
    content: str

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
    file_name: str
    file_url: str
    cloudinary_public_id: str
    file_size: int
    page_count: Optional[int] = None
    upload_status: str

class DocumentCreate(DocumentBase):
    id: str

class DocumentResponse(DocumentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Extended schema to get detailed info of a document, including pages and logs
class DocumentDetailResponse(DocumentResponse):
    contents: List[DocumentContentResponse] = []
    logs: List[DocumentProcessingLogResponse] = []

# Schema specifically for the Upload response
class DocumentUploadResponse(BaseModel):
    document_id: str
    status: str
