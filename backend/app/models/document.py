import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    cloudinary_url = Column(String(1024), nullable=False)
    cloudinary_public_id = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    processing_status = Column(String(50), nullable=False, default="idle")
    page_count = Column(Integer, nullable=True)
    estimated_reading_time = Column(Integer, nullable=True)  # in minutes
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    contents = relationship("DocumentContent", back_populates="document", cascade="all, delete-orphan")
    logs = relationship("DocumentProcessingLog", back_populates="document", cascade="all, delete-orphan")
    summary = relationship("DocumentSummary", back_populates="document", uselist=False, cascade="all, delete-orphan")
    concepts = relationship("Concept", back_populates="document", cascade="all, delete-orphan")
    revision_notes = relationship("RevisionNote", back_populates="document", cascade="all, delete-orphan")
    important_questions = relationship("ImportantQuestion", back_populates="document", cascade="all, delete-orphan")


class DocumentContent(Base):
    __tablename__ = "document_content"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    raw_text = Column(Text, nullable=False)
    word_count = Column(Integer, nullable=False)
    character_count = Column(Integer, nullable=False)
    
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


class DocumentSummary(Base):
    __tablename__ = "document_summaries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    summary_json = Column(JSON, nullable=False)
    learning_time = Column(String(50), nullable=False, default="10 minutes")
    generated_by_model = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    document = relationship("Document", back_populates="summary")

