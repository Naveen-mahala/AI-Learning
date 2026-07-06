import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.repositories.document_repo import DocumentRepository
from app.services.processing_service import ProcessingService
from app.services.cloudinary_service import CloudinaryService
from app.schemas.document import (
    DocumentResponse, 
    DocumentDetailResponse, 
    DocumentUploadResponse
)

logger = logging.getLogger(__name__)

# Declare APIRouter without a prefix to accommodate both /api/upload-pdf, /api/documents and /api/document/{id}
router = APIRouter(tags=["documents"])


@router.post("/api/upload-pdf", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
@router.post("/api/documents/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Validates PDF, uploads to Cloudinary, creates initial DB record,
    runs synchronous text extraction, cleans content, calculates statistics and stores in DB.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid upload. No filename provided."
        )

    # Read file content in-memory
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    # Delegate to the processing service
    try:
        result = ProcessingService.process_document_sync(
            db=db,
            file_bytes=file_bytes,
            filename=file.filename,
            file_size=file_size
        )
        return DocumentUploadResponse(
            success=True,
            document_id=result["document_id"],
            file_url=result["file_url"],
            pages=result["pages"],
            words=result["words"]
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error during PDF ingestion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/api/documents", response_model=List[DocumentResponse])
def list_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Returns list of all uploaded documents.
    """
    docs = DocumentRepository.list_documents(db, skip=skip, limit=limit)
    response_docs = []
    for doc in docs:
        word_count = doc.contents[0].word_count if doc.contents else 0
        char_count = doc.contents[0].character_count if doc.contents else 0
        response_docs.append(
            DocumentResponse(
                id=doc.id,
                title=doc.title,
                filename=doc.filename,
                cloudinary_url=doc.cloudinary_url,
                cloudinary_public_id=doc.cloudinary_public_id,
                file_size=doc.file_size,
                processing_status=doc.processing_status,
                page_count=doc.page_count,
                estimated_reading_time=doc.estimated_reading_time,
                word_count=word_count,
                character_count=char_count,
                created_at=doc.created_at,
                updated_at=doc.updated_at
            )
        )
    return response_docs


@router.get("/api/document/{id}", response_model=DocumentDetailResponse)
@router.get("/api/documents/{id}", response_model=DocumentDetailResponse)
def get_document(id: str, db: Session = Depends(get_db)):
    """
    Returns details of a specific document including metadata and text preview (first 1000 characters).
    """
    doc = DocumentRepository.get_document(db, id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {id} not found."
        )
        
    raw_text = doc.contents[0].raw_text if doc.contents else ""
    text_preview = raw_text[:1000]
    word_count = doc.contents[0].word_count if doc.contents else 0
    char_count = doc.contents[0].character_count if doc.contents else 0
    
    return DocumentDetailResponse(
        id=doc.id,
        title=doc.title,
        filename=doc.filename,
        cloudinary_url=doc.cloudinary_url,
        cloudinary_public_id=doc.cloudinary_public_id,
        file_size=doc.file_size,
        processing_status=doc.processing_status,
        page_count=doc.page_count,
        estimated_reading_time=doc.estimated_reading_time,
        word_count=word_count,
        character_count=char_count,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        text_preview=text_preview,
        logs=doc.logs
    )


@router.delete("/api/document/{id}", status_code=status.HTTP_200_OK)
@router.delete("/api/documents/{id}", status_code=status.HTTP_200_OK)
def delete_document(id: str, db: Session = Depends(get_db)):
    """
    Deletes document from database, related tables (cascade), and Cloudinary.
    """
    doc = DocumentRepository.get_document(db, id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {id} not found."
        )
        
    # Delete asset from Cloudinary
    if doc.cloudinary_public_id:
        CloudinaryService.delete_pdf(doc.cloudinary_public_id)
        
    # Delete from database (cascades automatically to document_content and logs)
    success = DocumentRepository.delete_document(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document from database."
        )
         
    return {"message": "Document deleted successfully"}
