from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.document import Document, DocumentContent, DocumentProcessingLog
from app.schemas.document import DocumentCreate, DocumentContentBase

class DocumentRepository:
    @staticmethod
    def create_document(db: Session, doc_create: DocumentCreate) -> Document:
        db_doc = Document(
            id=doc_create.id,
            title=doc_create.title,
            file_name=doc_create.file_name,
            file_url=doc_create.file_url,
            cloudinary_public_id=doc_create.cloudinary_public_id,
            file_size=doc_create.file_size,
            page_count=doc_create.page_count,
            upload_status=doc_create.upload_status
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        return db_doc

    @staticmethod
    def get_document(db: Session, doc_id: str) -> Optional[Document]:
        return db.query(Document).filter(Document.id == doc_id).first()

    @staticmethod
    def get_document_by_name_and_size(db: Session, file_name: str, file_size: int) -> Optional[Document]:
        # Checks if a document with same name and size exists (and is not failed) to prevent duplication
        return db.query(Document).filter(
            Document.file_name == file_name,
            Document.file_size == file_size,
            Document.upload_status != "failed"
        ).first()

    @staticmethod
    def list_documents(db: Session, skip: int = 0, limit: int = 100) -> List[Document]:
        return db.query(Document).order_by(Document.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def update_document_status(db: Session, doc_id: str, status: str) -> Optional[Document]:
        db_doc = db.query(Document).filter(Document.id == doc_id).first()
        if db_doc:
            db_doc.upload_status = status
            db.commit()
            db.refresh(db_doc)
        return db_doc

    @staticmethod
    def update_document_page_count(db: Session, doc_id: str, page_count: int) -> Optional[Document]:
        db_doc = db.query(Document).filter(Document.id == doc_id).first()
        if db_doc:
            db_doc.page_count = page_count
            db.commit()
            db.refresh(db_doc)
        return db_doc

    @staticmethod
    def add_page_contents(db: Session, doc_id: str, pages: List[DocumentContentBase]):
        db_contents = [
            DocumentContent(
                document_id=doc_id,
                page_number=p.page_number,
                content=p.content
            )
            for p in pages
        ]
        db.bulk_save_objects(db_contents)
        db.commit()

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
