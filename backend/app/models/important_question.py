from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class ImportantQuestion(Base):
    __tablename__ = "important_questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    question_mode = Column(String(50), nullable=False)  # "Exam Mode", "Interview Mode", "Viva Mode", "Mixed Mode"
    questions_json = Column(JSON, nullable=False)
    generated_by_model = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to Document
    document = relationship("Document", back_populates="important_questions")
