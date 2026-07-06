from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.models.document import Document, DocumentContent, DocumentProcessingLog
from app.schemas.document import DocumentCreate

class DocumentRepository:
    @staticmethod
    def create_document(db: Session, doc_create: DocumentCreate) -> Document:
        db_doc = Document(
            id=doc_create.id,
            title=doc_create.title,
            filename=doc_create.filename,
            cloudinary_url=doc_create.cloudinary_url,
            cloudinary_public_id=doc_create.cloudinary_public_id,
            file_size=doc_create.file_size,
            page_count=doc_create.page_count,
            estimated_reading_time=doc_create.estimated_reading_time,
            processing_status=doc_create.processing_status
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        return db_doc

    @staticmethod
    def get_document(db: Session, doc_id: str) -> Optional[Document]:
        return db.query(Document).options(
            joinedload(Document.contents),
            joinedload(Document.logs)
        ).filter(Document.id == doc_id).first()

    @staticmethod
    def get_document_by_name_and_size(db: Session, filename: str, file_size: int) -> Optional[Document]:
        # Checks if a document with same name and size exists (and is not failed) to prevent duplication
        return db.query(Document).filter(
            Document.filename == filename,
            Document.file_size == file_size,
            Document.processing_status != "failed"
        ).first()

    @staticmethod
    def list_documents(db: Session, skip: int = 0, limit: int = 100) -> List[Document]:
        return db.query(Document).options(
            joinedload(Document.contents)
        ).order_by(Document.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def update_document_status(db: Session, doc_id: str, status: str) -> Optional[Document]:
        db_doc = db.query(Document).filter(Document.id == doc_id).first()
        if db_doc:
            db_doc.processing_status = status
            db.commit()
            db.refresh(db_doc)
        return db_doc

    @staticmethod
    def update_document_metadata(db: Session, doc_id: str, page_count: int, estimated_reading_time: int) -> Optional[Document]:
        db_doc = db.query(Document).filter(Document.id == doc_id).first()
        if db_doc:
            db_doc.page_count = page_count
            db_doc.estimated_reading_time = estimated_reading_time
            db.commit()
            db.refresh(db_doc)
        return db_doc

    @staticmethod
    def add_document_content(db: Session, doc_id: str, raw_text: str, word_count: int, character_count: int) -> DocumentContent:
        db_content = DocumentContent(
            document_id=doc_id,
            raw_text=raw_text,
            word_count=word_count,
            character_count=character_count
        )
        db.add(db_content)
        db.commit()
        db.refresh(db_content)
        return db_content

    @staticmethod
    def log_processing_step(db: Session, doc_id: str, status: str, message: str) -> DocumentProcessingLog:
        log = DocumentProcessingLog(
            document_id=doc_id,
            status=status,
            message=message
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def delete_document(db: Session, doc_id: str) -> bool:
        db_doc = db.query(Document).filter(Document.id == doc_id).first()
        if db_doc:
            db.delete(db_doc)
            db.commit()
            return True
        return False
