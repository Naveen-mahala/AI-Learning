import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.document_repo import DocumentRepository
from app.repositories.concept_repo import ConceptRepository
from app.services.ai_service import AIManager, AIProviderError
from app.schemas.concept import ConceptCreate

logger = logging.getLogger(__name__)

class ConceptService:
    @staticmethod
    def extract_concepts_sync(db: Session, doc_id: str, provider: Optional[str] = None) -> Dict[str, Any]:
        """
        Synchronously runs the Concept Extraction Pipeline:
        1. Retrieve document text content.
        2. Validate content (handle tiny/empty documents).
        3. Call AI Service to extract structured concepts.
        4. Clear existing concepts for the document (ensures idempotency).
        5. Traverse and flatten the concepts hierarchy.
        6. Save concepts to database and resolve relations (Parent/Child, Related, Prerequisite).
        """
        # 1. Retrieve document metadata
        doc = DocumentRepository.get_document(db, doc_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {doc_id} not found."
            )

        # 2. Validate document content length (handling poor or empty PDFs)
        if not doc.contents or not doc.contents[0].raw_text or len(doc.contents[0].raw_text.strip()) < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This document does not contain enough text content to extract concepts."
            )

        raw_text = doc.contents[0].raw_text

        # Create step logs
        DocumentRepository.log_processing_step(db, doc_id, "extracting_concepts", "AI Concept Extraction engine triggered.")

        try:
            # 3. Call AI Service
            DocumentRepository.log_processing_step(db, doc_id, "extracting_concepts", "Analyzing educational content & extracting concepts...")
            raw_data = AIManager.generate_concepts(doc.title, raw_text, provider_name=provider)
            
            DocumentRepository.log_processing_step(db, doc_id, "extracting_concepts", "Structuring concept hierarchy and establishing relationships...")

            # 4. Clear existing concepts to make the operation idempotent (prevent duplicates on retry)
            ConceptRepository.delete_document_concepts(db, doc_id)

            # 5. Flatten the hierarchy and map parent-child relations
            core_concepts = raw_data.get("core_concepts", [])
            
            flat_concepts = {}  # norm_name -> concept_dict
            parent_child_relations = []  # list of (parent_norm_name, child_norm_name)

            def traverse(concept_dict: dict, parent_name: Optional[str] = None):
                name = concept_dict.get("name", "").strip()
                if not name:
                    return
                
                norm_name = name.lower()
                
                # Store the concept data if not already processed
                if norm_name not in flat_concepts:
                    flat_concepts[norm_name] = {
                        "name": name,  # Preserves original casing
                        "category": concept_dict.get("category", "Supporting Concept"),
                        "importance_score": concept_dict.get("importance_score", 70),
                        "definition": concept_dict.get("definition", "No definition available."),
                        "learning_tips": concept_dict.get("learning_tips", ""),
                        "related_concepts": concept_dict.get("related_concepts", []),
                        "prerequisite_concepts": concept_dict.get("prerequisite_concepts", [])
                    }
                
                # Track hierarchy
                if parent_name:
                    parent_child_relations.append((parent_name.lower(), norm_name))

                # Traverse child/sub-concepts
                for sub in concept_dict.get("sub_concepts", []):
                    traverse(sub, parent_name=name)

            # Build flat list of all concepts
            for core in core_concepts:
                traverse(core)

            # 6. Save concepts to DB
            name_to_db_id = {}
            for norm_name, c_data in flat_concepts.items():
                c_create = ConceptCreate(
                    document_id=doc_id,
                    name=c_data["name"],
                    category=c_data["category"],
                    importance_score=c_data["importance_score"],
                    definition=c_data["definition"],
                    learning_tips=c_data["learning_tips"]
                )
                db_concept = ConceptRepository.create_concept(db, c_create)
                name_to_db_id[norm_name] = db_concept.id

            # 7. Establish relationships
            # A. Parent-Child relationships (bidirectional for convenience in lookup)
            for parent_norm, child_norm in parent_child_relations:
                p_id = name_to_db_id.get(parent_norm)
                c_id = name_to_db_id.get(child_norm)
                if p_id and c_id:
                    ConceptRepository.create_relationship(db, p_id, c_id, "Child")
                    ConceptRepository.create_relationship(db, c_id, p_id, "Parent")

            # B. Related and Prerequisite relationships
            for norm_name, c_data in flat_concepts.items():
                source_id = name_to_db_id.get(norm_name)
                if not source_id:
                    continue

                # Related relationships (bidirectional)
                for related_name in c_data.get("related_concepts", []):
                    target_id = name_to_db_id.get(related_name.lower())
                    if target_id and source_id != target_id:
                        ConceptRepository.create_relationship(db, source_id, target_id, "Related")

                # Prerequisite relationships (unidirectional: source requires target)
                for prereq_name in c_data.get("prerequisite_concepts", []):
                    target_id = name_to_db_id.get(prereq_name.lower())
                    if target_id and source_id != target_id:
                        ConceptRepository.create_relationship(db, source_id, target_id, "Prerequisite")

            # Log success
            DocumentRepository.log_processing_step(db, doc_id, "completed", f"Concept Extraction completed successfully. Extracted {len(name_to_db_id)} concepts.")
            
            return {
                "success": True,
                "document_id": doc_id,
                "extracted_count": len(name_to_db_id),
                "concepts": list(flat_concepts.values())
            }

        except AIProviderError as pe:
            logger.error(f"Concept extraction AI provider failure: {str(pe)}")
            DocumentRepository.log_processing_step(db, doc_id, "failed", f"Concept extraction failed: {str(pe)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI Service Failure: {str(pe)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error during concept extraction: {str(e)}")
            DocumentRepository.log_processing_step(db, doc_id, "failed", f"Unexpected concept extraction error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An unexpected error occurred during concept extraction: {str(e)}"
            )
