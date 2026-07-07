import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.repositories.document_repo import DocumentRepository
from app.repositories.concept_repo import ConceptRepository
from app.services.concept_service import ConceptService
from app.schemas.concept import (
    ConceptResponse,
    ConceptDetailResponse,
    DocumentConceptsResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["concepts"])

@router.post("/api/document/{id}/extract-concepts", status_code=status.HTTP_201_CREATED)
@router.post("/api/documents/{id}/extract-concepts", status_code=status.HTTP_201_CREATED)
def extract_concepts(
    id: str,
    provider: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Triggers the concept extraction pipeline for a document.
    Extracts core concepts, sub-concepts, definitions, importance, and relationships.
    Saves them in the database and returns a summary.
    """
    logger.info(f"Extract concepts API request received for document {id}")
    return ConceptService.extract_concepts_sync(db=db, doc_id=id, provider=provider)


@router.get("/api/document/{id}/concepts", response_model=DocumentConceptsResponse)
@router.get("/api/documents/{id}/concepts", response_model=DocumentConceptsResponse)
def get_document_concepts(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieves all extracted concepts and relationships for a document.
    This builds the educational knowledge layer graph for mind maps, tutoring, etc.
    """
    # Verify document exists
    doc = DocumentRepository.get_document(db, id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {id} not found."
        )

    concepts = ConceptRepository.get_document_concepts(db, id)
    relationships = ConceptRepository.get_document_relationships(db, id)

    return DocumentConceptsResponse(
        document_id=id,
        document_title=doc.title,
        concepts=concepts,
        relationships=relationships
    )


@router.get("/api/concept/{id}", response_model=ConceptDetailResponse)
def get_concept_detail(
    id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieves a single concept by ID and resolves its learning relationships:
    parent concepts, sub-concepts, prerequisite concepts, related concepts, and advanced concepts.
    Powers the Concept Detail side panel.
    """
    concept, sub_concepts, parent_concepts, related_concepts, prerequisites, advanced = (
        ConceptRepository.get_concept_details(db, id)
    )

    if not concept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Concept with ID {id} not found."
        )

    return ConceptDetailResponse(
        id=concept.id,
        document_id=concept.document_id,
        name=concept.name,
        category=concept.category,
        importance_score=concept.importance_score,
        definition=concept.definition,
        learning_tips=concept.learning_tips,
        created_at=concept.created_at,
        sub_concepts=sub_concepts,
        parent_concepts=parent_concepts,
        related_concepts=related_concepts,
        prerequisite_concepts=prerequisites,
        advanced_concepts=advanced
    )
