from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class Concept(Base):
    __tablename__ = "concepts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # Core Concept, Supporting Concept, Advanced Concept, Interview Concept
    importance_score = Column(Integer, nullable=False)
    definition = Column(Text, nullable=False)
    learning_tips = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to Document
    document = relationship("Document", back_populates="concepts")

    # Relationships with cascade delete to relationships
    relationships_out = relationship(
        "ConceptRelationship",
        foreign_keys="[ConceptRelationship.source_concept_id]",
        cascade="all, delete-orphan",
        back_populates="source"
    )
    relationships_in = relationship(
        "ConceptRelationship",
        foreign_keys="[ConceptRelationship.target_concept_id]",
        cascade="all, delete-orphan",
        back_populates="target"
    )


class ConceptRelationship(Base):
    __tablename__ = "concept_relationships"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_concept_id = Column(Integer, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False)
    target_concept_id = Column(Integer, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False)
    relationship_type = Column(String(50), nullable=False)  # Parent, Child, Related, Prerequisite, Advanced

    # Relationships to enable easy joins/access in repository
    source = relationship("Concept", foreign_keys=[source_concept_id], back_populates="relationships_out")
    target = relationship("Concept", foreign_keys=[target_concept_id], back_populates="relationships_in")
