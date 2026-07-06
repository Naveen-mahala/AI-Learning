import uuid
import logging
import math
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.document_repo import DocumentRepository
from app.services.cloudinary_service import CloudinaryService
from app.services.extraction_service import ExtractionService
from app.schemas.document import DocumentCreate
from app.utils.text_cleaner import clean_text

logger = logging.getLogger(__name__)

class ProcessingService:
    @staticmethod
    def validate_file(file_name: str, file_size: int, content_type: str):
        """
        Validates the file's extension, MIME type, and size.
        """
        # Validate file extension
        ext = file_name.split(".")[-1].lower() if "." in file_name else ""
        if ext != "pdf":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format: .{ext}. Only PDF is allowed."
            )
            
        # Validate MIME type
        allowed_mimes = ["application/pdf", "application/x-pdf"]
        if content_type not in allowed_mimes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only PDF documents are allowed."
            )
            
        # Validate file size (limit: 25MB = 25 * 1024 * 1024 bytes)
        max_size = 25 * 1024 * 1024
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds the 25MB limit (actual: {file_size / (1024 * 1024):.1f}MB)."
            )

    @staticmethod
    def process_document_sync(db: Session, file_bytes: bytes, filename: str, file_size: int) -> dict:
        """
        Synchronously runs the complete PDF Ingestion Pipeline:
        1. Validate file size and type.
        2. Upload to Cloudinary.
        3. Create initial DB record in 'documents'.
        4. Extract text page-by-page.
        5. Combine, clean and compute statistics.
        6. Store combined raw_text in 'document_content'.
        7. Update DB record status and metadata.
        Returns:
            dict matching the API response format.
        """
        # 1. Validate file size/extension
        # Note: We pass application/pdf as the default content-type for validator since we checked ext
        ProcessingService.validate_file(filename, file_size, "application/pdf")
        
        # 2. Check for duplicates (same name and size)
        existing = DocumentRepository.get_document_by_name_and_size(db, filename, file_size)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A document with the same name and size already exists in the catalog."
            )
            
        doc_id = str(uuid.uuid4())
        
        # 3. Upload to Cloudinary
        try:
            upload_result = CloudinaryService.upload_pdf(file_bytes, filename)
        except Exception as e:
            logger.error(f"Cloudinary upload failed for {filename}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Cloudinary storage provider error: {str(e)}"
            )
            
        cloudinary_url = upload_result["secure_url"]
        cloudinary_public_id = upload_result["public_id"]
        
        # Create initial Document record in DB with status "processing"
        doc_create = DocumentCreate(
            id=doc_id,
            title=filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " "),
            filename=filename,
            cloudinary_url=cloudinary_url,
            cloudinary_public_id=cloudinary_public_id,
            file_size=file_size,
            processing_status="processing",
            page_count=0,
            estimated_reading_time=0
        )
        
        DocumentRepository.create_document(db, doc_create)
        DocumentRepository.log_processing_step(db, doc_id, "started", "Document upload verified and record initialized.")
        DocumentRepository.log_processing_step(db, doc_id, "uploaded_to_cloudinary", f"File saved in Cloudinary storage folder at {cloudinary_url}")
        
        try:
            DocumentRepository.log_processing_step(db, doc_id, "processing_text", "Loading document pages for text extraction...")
            
            # 4. Extract Pages using PyMuPDF with pdfplumber fallback
            pages, metadata, page_count = ExtractionService.extract_pdf(file_bytes)
            
            # Combine content of all non-empty pages
            non_empty_pages_text = []
            for p in pages:
                cleaned_page_text = p["content"]
                if cleaned_page_text.strip():
                    non_empty_pages_text.append(cleaned_page_text)
            
            combined_text = "\n\n".join(non_empty_pages_text)
            
            # Clean combined text to ensure spacing between page transitions is clean
            cleaned_text = clean_text(combined_text)
            
            # 5. Calculate statistics
            word_count = len(cleaned_text.split()) if cleaned_text.strip() else 0
            character_count = len(cleaned_text)
            estimated_reading_time = math.ceil(word_count / 200)  # average 200 words/minute
            
            # 6. Store combined content in database
            DocumentRepository.log_processing_step(db, doc_id, "storing_content", f"Saving combined content in database (words: {word_count}, chars: {character_count}).")
            DocumentRepository.add_document_content(
                db, doc_id, cleaned_text, word_count, character_count
            )
            
            # 7. Update document metadata and status to completed
            DocumentRepository.update_document_metadata(db, doc_id, page_count, estimated_reading_time)
            DocumentRepository.update_document_status(db, doc_id, "completed")
            DocumentRepository.log_processing_step(db, doc_id, "completed", "Ingestion pipeline completed successfully. Ready for AI processing.")
            
            logger.info(f"Ingestion completed synchronously for document {doc_id}")
            
            return {
                "success": True,
                "document_id": doc_id,
                "file_url": cloudinary_url,
                "pages": page_count,
                "words": word_count
            }
            
        except Exception as e:
            logger.error(f"Ingestion failed for document {doc_id}: {str(e)}")
            DocumentRepository.update_document_status(db, doc_id, "failed")
            DocumentRepository.log_processing_step(db, doc_id, "failed", f"Ingestion pipeline failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"PDF extraction and processing failed: {str(e)}"
            )
