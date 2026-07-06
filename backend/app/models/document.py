import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(1024), nullable=False)
    cloudinary_public_id = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    page_count = Column(Integer, nullable=True)
    upload_status = Column(String(50), nullable=False, default="idle")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    contents = relationship("DocumentContent", back_populates="document", cascade="all, delete-orphan")
    logs = relationship("DocumentProcessingLog", back_populates="document", cascade="all, delete-orphan")


class DocumentContent(Base):
    __tablename__ = "document_content"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    document = relationship("Document", back_populates="contents")


class DocumentProcessingLog(Base):
    __tablename__ = "document_processing_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    document = relationship("Document", back_populates="logs")
