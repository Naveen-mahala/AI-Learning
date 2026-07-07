from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Concept schemas
class ConceptBase(BaseModel):
    name: str
    category: str  # Core Concept, Supporting Concept, Advanced Concept, Interview Concept
    importance_score: int
    definition: str
    learning_tips: Optional[str] = None

    class Config:
        from_attributes = True

class ConceptCreate(ConceptBase):
    document_id: str

class ConceptResponse(ConceptBase):
    id: int
    document_id: str
    created_at: datetime


# Concept Relationship schemas
class ConceptRelationshipBase(BaseModel):
    source_concept_id: int
    target_concept_id: int
    relationship_type: str  # Parent, Child, Related, Prerequisite, Advanced

    class Config:
        from_attributes = True

class RelationshipResponse(ConceptRelationshipBase):
    id: int


# Detailed relationship info for lists/drawers
class ConceptRelationshipDetail(BaseModel):
    concept_id: int
    name: str
    relationship_type: str
    category: str
    importance_score: int


# Detailed single concept response with relationships resolved
class ConceptDetailResponse(ConceptResponse):
    sub_concepts: List[ConceptResponse] = []
    parent_concepts: List[ConceptResponse] = []
    related_concepts: List[ConceptResponse] = []
    prerequisite_concepts: List[ConceptResponse] = []
    advanced_concepts: List[ConceptResponse] = []


# Complete document concepts payload response
class DocumentConceptsResponse(BaseModel):
    document_id: str
    document_title: str
    concepts: List[ConceptResponse]
    relationships: List[RelationshipResponse]

    class Config:
        from_attributes = True
