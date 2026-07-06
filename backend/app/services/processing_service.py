import uuid
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.document_repo import DocumentRepository
from app.services.cloudinary_service import CloudinaryService
from app.services.extraction_service import ExtractionService
from app.schemas.document import DocumentCreate, DocumentContentBase

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
        # Some browsers/OSs might report slightly different content-types, so check both extension and MIME
        allowed_mimes = ["application/pdf", "application/x-pdf"]
        if content_type not in allowed_mimes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Only PDF documents are allowed."
            )
            
        # Validate file size (limit: 25MB = 25 * 1024 * 1024 bytes)
        max_size = 25 * 1024 * 1024
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds the 25MB limit (actual: {file_size / (1024 * 1024):.1f}MB)."
            )

    @staticmethod
    def upload_and_init_db(db: Session, file_bytes: bytes, file_name: str, file_size: int) -> str:
        """
        Initializes the document:
        1. Checks for duplicates.
        2. Uploads the file to Cloudinary.
        3. Creates the initial record in the PostgreSQL database.
        Returns the generated document_id.
        """
        # Check duplicate (prevent uploading exact same file name and size again)
        existing = DocumentRepository.get_document_by_name_and_size(db, file_name, file_size)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A document with the same name and size already exists in the catalog."
            )
            
        doc_id = str(uuid.uuid4())
        
        # Step 2: Upload to Cloudinary with retry handling
        try:
            upload_result = CloudinaryService.upload_pdf(file_bytes, file_name)
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Cloudinary storage provider error: {str(e)}"
            )
            
        # Step 3: Create Document Record in DB
        doc_create = DocumentCreate(
            id=doc_id,
            title=file_name.rsplit(".", 1)[0].replace("_", " "),
            file_name=file_name,
            file_url=upload_result["secure_url"],
            cloudinary_public_id=upload_result["public_id"],
            file_size=file_size,
            upload_status="processing"
        )
        
        DocumentRepository.create_document(db, doc_create)
        DocumentRepository.log_processing_step(db, doc_id, "started", "Document upload verified and record initialized.")
        DocumentRepository.log_processing_step(db, doc_id, "uploaded_to_cloudinary", f"File saved in Cloudinary storage folder at {upload_result['secure_url']}")
        
        return doc_id

    @staticmethod
    def process_document_background(db_session_factory, doc_id: str, file_bytes: bytes):
        """
        Background process that extracts text and updates the document record.
        Runs in a background thread to prevent API request timeout.
        """
        # Create a new session for this thread
        db: Session = db_session_factory()
        try:
            DocumentRepository.log_processing_step(db, doc_id, "processing_text", "Loading document pages for text extraction...")
            
            # Step 4: Extract Pages using PyMuPDF (fitz) with pdfplumber fallback
            pages, metadata, page_count = ExtractionService.extract_pdf(file_bytes)
            
            # Update page count in the document record
            DocumentRepository.update_document_page_count(db, doc_id, page_count)
            DocumentRepository.log_processing_step(db, doc_id, "pages_extracted", f"Successfully extracted and cleaned {page_count} pages.")
            
            # Step 5: Store Content page-by-page
            DocumentRepository.log_processing_step(db, doc_id, "storing_content", "Saving page contents in database storage...")
            db_pages = [
                DocumentContentBase(page_number=p["page_number"], content=p["content"])
                for p in pages
            ]
            DocumentRepository.add_page_contents(db, doc_id, db_pages)
            
            # Step 6: Update Status to completed
            DocumentRepository.update_document_status(db, doc_id, "completed")
            DocumentRepository.log_processing_step(db, doc_id, "completed", "Ingestion pipeline completed successfully. Ready for AI processing.")
            logger.info(f"Ingestion completed for document {doc_id}")
            
        except Exception as e:
            logger.error(f"Ingestion failed for document {doc_id}: {str(e)}")
            DocumentRepository.update_document_status(db, doc_id, "failed")
            DocumentRepository.log_processing_step(db, doc_id, "failed", f"Ingestion pipeline failed: {str(e)}")
        finally:
            db.close()
