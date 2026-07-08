import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.repositories.document_repo import DocumentRepository
from app.services.processing_service import ProcessingService
from app.services.cloudinary_service import CloudinaryService
from app.schemas.document import (
    DocumentResponse, 
    DocumentDetailResponse, 
    DocumentUploadResponse,
    DocumentSummaryResponse
)
from app.services.ai_service import AIManager, AIProviderError
from app.schemas.revision_note import RevisionNoteResponse
from app.services.revision_note_service import RevisionNoteService
from app.repositories.revision_note_repo import RevisionNoteRepository
from app.schemas.important_question import ImportantQuestionResponse
from app.services.important_question_service import ImportantQuestionService
from app.repositories.important_question_repo import ImportantQuestionRepository

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


@router.post("/api/document/{id}/generate-summary", response_model=DocumentSummaryResponse)
@router.post("/api/documents/{id}/generate-summary", response_model=DocumentSummaryResponse)
def generate_summary(id: str, provider: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Retrieves the extracted document text and triggers AI-based structured learning package generation.
    Stores the package in the database and returns it.
    """
    doc = DocumentRepository.get_document(db, id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {id} not found."
        )

    if not doc.contents or not doc.contents[0].raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate summary: No extracted text content is associated with this document."
        )

    raw_text = doc.contents[0].raw_text

    try:
        # Step-by-step progress logging in database
        DocumentRepository.log_processing_step(db, id, "processing", "Smart Summary Generation Triggered.")
        
        # Invoke AI summary generator
        summary_data = AIManager.generate_summary(doc.title, raw_text, provider_name=provider)
        
        # Resolve model name used
        actual_provider = AIManager.get_provider(provider)
        model_name = type(actual_provider).__name__.replace("Provider", "")

        # Save to DB
        db_summary = DocumentRepository.create_or_update_document_summary(
            db=db,
            doc_id=id,
            summary_json=summary_data,
            learning_time="10 minutes",
            model_name=model_name
        )
        
        DocumentRepository.log_processing_step(db, id, "completed", "Smart Summary Generated successfully.")
        
        return db_summary
        
    except AIProviderError as pe:
        logger.error(f"AI provider failed: {str(pe)}")
        DocumentRepository.log_processing_step(db, id, "failed", f"Summary generation failed: {str(pe)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Service Failure: {str(pe)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error during summary generation: {str(e)}")
        DocumentRepository.log_processing_step(db, id, "failed", f"Unexpected summary error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/api/document/{id}/summary", response_model=DocumentSummaryResponse)
@router.get("/api/documents/{id}/summary", response_model=DocumentSummaryResponse)
def get_summary(id: str, db: Session = Depends(get_db)):
    """
    Retrieves the saved summary package for a document.
    """
    summary = DocumentRepository.get_document_summary(db, id)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Smart summary not found for document {id}. Please generate it first."
        )
    return summary


@router.post("/api/document/{id}/generate-revision", response_model=RevisionNoteResponse)
@router.post("/api/documents/{id}/generate-revision", response_model=RevisionNoteResponse)
def generate_revision(
    id: str,
    revision_type: str = "10 mins",
    provider: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Triggers AI-based Revision Notes generation for the given document and revision type.
    Saves the generated revision package to the database and returns it.
    """
    logger.info(f"Generate revision request received for document {id}, mode: {revision_type}")
    
    # Normalize revision_type
    valid_modes = ["5 mins", "10 mins", "20 mins"]
    if revision_type not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid revision_type '{revision_type}'. Must be one of {valid_modes}."
        )

    return RevisionNoteService.generate_revision_sync(
        db=db,
        doc_id=id,
        revision_type=revision_type,
        provider=provider
    )


@router.get("/api/document/{id}/revision", response_model=RevisionNoteResponse)
@router.get("/api/documents/{id}/revision", response_model=RevisionNoteResponse)
def get_revision(
    id: str,
    revision_type: str = "10 mins",
    db: Session = Depends(get_db)
):
    """
    Retrieves the saved revision notes package for a document, filtered by revision type.
    """
    valid_modes = ["5 mins", "10 mins", "20 mins"]
    if revision_type not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid revision_type '{revision_type}'. Must be one of {valid_modes}."
        )

    revision = RevisionNoteRepository.get_revision_note(db, id, revision_type)
    if not revision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Revision notes not found for document {id} with mode '{revision_type}'."
        )
    return revision


@router.post("/api/document/{id}/generate-important-questions", response_model=ImportantQuestionResponse)
@router.post("/api/documents/{id}/generate-important-questions", response_model=ImportantQuestionResponse)
def generate_important_questions(
    id: str,
    question_mode: str = "Mixed Mode",
    provider: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Triggers AI-based Important Questions generation for the given document and question mode.
    Saves the generated questions package to the database and returns it.
    """
    logger.info(f"Generate important questions request received for document {id}, mode: {question_mode}")
    
    valid_modes = ["Exam Mode", "Interview Mode", "Viva Mode", "Mixed Mode"]
    if question_mode not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid question_mode '{question_mode}'. Must be one of {valid_modes}."
        )

    return ImportantQuestionService.generate_questions_sync(
        db=db,
        doc_id=id,
        question_mode=question_mode,
        provider=provider
    )


@router.get("/api/document/{id}/important-questions", response_model=ImportantQuestionResponse)
@router.get("/api/documents/{id}/important-questions", response_model=ImportantQuestionResponse)
def get_important_questions(
    id: str,
    question_mode: str = "Mixed Mode",
    db: Session = Depends(get_db)
):
    """
    Retrieves the saved important questions package for a document, filtered by question mode.
    """
    valid_modes = ["Exam Mode", "Interview Mode", "Viva Mode", "Mixed Mode"]
    if question_mode not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid question_mode '{question_mode}'. Must be one of {valid_modes}."
        )

    questions = ImportantQuestionRepository.get_questions(db, id, question_mode)
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Important questions not found for document {id} with mode '{question_mode}'."
        )
    return questions



