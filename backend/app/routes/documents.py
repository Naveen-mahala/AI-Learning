from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db, SessionLocal
from app.repositories.document_repo import DocumentRepository
from app.services.processing_service import ProcessingService
from app.services.cloudinary_service import CloudinaryService
from app.schemas.document import DocumentResponse, DocumentDetailResponse, DocumentUploadResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Validates PDF, uploads to Cloudinary, creates initial DB record,
    and schedules extraction as a background task.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid upload. No filename provided."
        )

    # Read file content in-memory for validation and processing
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    # 1. Validate file format and size
    ProcessingService.validate_file(file.filename, file_size, file.content_type or "")
    
    # 2. Upload to Cloudinary and initialize database records
    document_id = ProcessingService.upload_and_init_db(
        db, file_bytes, file.filename, file_size
    )
    
    # 3. Schedule asynchronous text extraction and database storage
    background_tasks.add_task(
        ProcessingService.process_document_background,
        SessionLocal,
        document_id,
        file_bytes
    )
    
    return DocumentUploadResponse(document_id=document_id, status="uploaded")


@router.get("", response_model=List[DocumentResponse])
def list_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Returns list of all uploaded documents.
    """
    return DocumentRepository.list_documents(db, skip=skip, limit=limit)


@router.get("/{id}", response_model=DocumentDetailResponse)
def get_document(id: str, db: Session = Depends(get_db)):
    """
    Returns details of a specific document including pages and logs.
    """
    doc = DocumentRepository.get_document(db, id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {id} not found."
        )
    return doc


@router.delete("/{id}", status_code=status.HTTP_200_OK)
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
        
    # Delete from database (which cascades deletes to document_content and document_processing_logs)
    success = DocumentRepository.delete_document(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document from database."
        )
         
    return {"message": "Document deleted successfully"}
