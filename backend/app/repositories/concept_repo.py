from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from app.models.concept import Concept, ConceptRelationship
from app.schemas.concept import ConceptCreate

class ConceptRepository:
    @staticmethod
    def create_concept(db: Session, concept_in: ConceptCreate) -> Concept:
        # Check if concept already exists for this document (prevent duplicate concepts)
        existing = db.query(Concept).filter(
            Concept.document_id == concept_in.document_id,
            Concept.name == concept_in.name
        ).first()

        if existing:
            # Update fields if it already exists (idempotent / merge behavior)
            existing.category = concept_in.category
            existing.importance_score = concept_in.importance_score
            existing.definition = concept_in.definition
            existing.learning_tips = concept_in.learning_tips
            db.commit()
            db.refresh(existing)
            return existing
        else:
            db_concept = Concept(
                document_id=concept_in.document_id,
                name=concept_in.name,
                category=concept_in.category,
                importance_score=concept_in.importance_score,
                definition=concept_in.definition,
                learning_tips=concept_in.learning_tips
            )
            db.add(db_concept)
            db.commit()
            db.refresh(db_concept)
            return db_concept

    @staticmethod
    def create_relationship(db: Session, source_id: int, target_id: int, relationship_type: str) -> ConceptRelationship:
        # Prevent self-relationships
        if source_id == target_id:
            return None

        # Check if relationship already exists to prevent duplicate entries
        existing = db.query(ConceptRelationship).filter(
            ConceptRelationship.source_concept_id == source_id,
            ConceptRelationship.target_concept_id == target_id,
            ConceptRelationship.relationship_type == relationship_type
        ).first()

        if existing:
            return existing

        db_relation = ConceptRelationship(
            source_concept_id=source_id,
            target_concept_id=target_id,
            relationship_type=relationship_type
        )
        db.add(db_relation)
        db.commit()
        db.refresh(db_relation)
        return db_relation

    @staticmethod
    def get_document_concepts(db: Session, doc_id: str) -> List[Concept]:
        return db.query(Concept).filter(Concept.document_id == doc_id).order_by(Concept.importance_score.desc()).all()

    @staticmethod
    def get_document_relationships(db: Session, doc_id: str) -> List[ConceptRelationship]:
        return db.query(ConceptRelationship).join(
            Concept, ConceptRelationship.source_concept_id == Concept.id
        ).filter(Concept.document_id == doc_id).all()

    @staticmethod
    def get_concept_by_id(db: Session, concept_id: int) -> Optional[Concept]:
        return db.query(Concept).filter(Concept.id == concept_id).first()

    @staticmethod
    def get_concept_details(db: Session, concept_id: int) -> Tuple[
        Optional[Concept], 
        List[Concept], 
        List[Concept], 
        List[Concept], 
        List[Concept], 
        List[Concept]
    ]:
        concept = db.query(Concept).filter(Concept.id == concept_id).first()
        if not concept:
            return None, [], [], [], [], []

        # Find relationships
        # 1. Sub-concepts (where this concept is the source/parent, and type is 'Child')
        sub_concepts = db.query(Concept).join(
            ConceptRelationship, ConceptRelationship.target_concept_id == Concept.id
        ).filter(
            ConceptRelationship.source_concept_id == concept_id,
            ConceptRelationship.relationship_type == "Child"
        ).all()

        # 2. Parent concepts (where this concept is the target/child, and type is 'Child' or source/parent and type is 'Parent')
        parent_concepts = db.query(Concept).join(
            ConceptRelationship, ConceptRelationship.source_concept_id == Concept.id
        ).filter(
            ConceptRelationship.target_concept_id == concept_id,
            ConceptRelationship.relationship_type == "Child"
        ).all()

        # 3. Related concepts (Related is bidirectional, query both directions)
        related_out = db.query(Concept).join(
            ConceptRelationship, ConceptRelationship.target_concept_id == Concept.id
        ).filter(
            ConceptRelationship.source_concept_id == concept_id,
            ConceptRelationship.relationship_type == "Related"
        ).all()

        related_in = db.query(Concept).join(
            ConceptRelationship, ConceptRelationship.source_concept_id == Concept.id
        ).filter(
            ConceptRelationship.target_concept_id == concept_id,
            ConceptRelationship.relationship_type == "Related"
        ).all()
        
        # Merge and deduplicate
        related_ids = set()
        related_concepts = []
        for c in related_out + related_in:
            if c.id != concept_id and c.id not in related_ids:
                related_ids.add(c.id)
                related_concepts.append(c)

        # 4. Prerequisites (prerequisites of this concept, meaning this is source and target is prerequisite)
        prerequisites = db.query(Concept).join(
            ConceptRelationship, ConceptRelationship.target_concept_id == Concept.id
        ).filter(
            ConceptRelationship.source_concept_id == concept_id,
            ConceptRelationship.relationship_type == "Prerequisite"
        ).all()

        # 5. Advanced (advanced topics of this concept, meaning this is source and target is advanced)
        advanced = db.query(Concept).join(
            ConceptRelationship, ConceptRelationship.target_concept_id == Concept.id
        ).filter(
            ConceptRelationship.source_concept_id == concept_id,
            ConceptRelationship.relationship_type == "Advanced"
        ).all()

        return concept, sub_concepts, parent_concepts, related_concepts, prerequisites, advanced

    @staticmethod
    def delete_document_concepts(db: Session, doc_id: str) -> None:
        db.query(Concept).filter(Concept.document_id == doc_id).delete(synchronize_session=False)
        db.commit()
