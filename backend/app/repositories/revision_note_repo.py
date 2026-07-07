from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.revision_note import RevisionNote

class RevisionNoteRepository:
    @staticmethod
    def get_revision_note(db: Session, doc_id: str, revision_type: str) -> Optional[RevisionNote]:
        return db.query(RevisionNote).filter(
            RevisionNote.document_id == doc_id,
            RevisionNote.revision_type == revision_type
        ).first()

    @staticmethod
    def list_revision_notes(db: Session, doc_id: str) -> List[RevisionNote]:
        return db.query(RevisionNote).filter(RevisionNote.document_id == doc_id).all()

    @staticmethod
    def create_or_update_revision_note(
        db: Session,
        doc_id: str,
        revision_type: str,
        revision_json: dict,
        model_name: str
    ) -> RevisionNote:
        # Check if one already exists
        existing = db.query(RevisionNote).filter(
            RevisionNote.document_id == doc_id,
            RevisionNote.revision_type == revision_type
        ).first()
        if existing:
            existing.revision_json = revision_json
            existing.generated_by_model = model_name
            db.commit()
            db.refresh(existing)
            return existing
        else:
            db_note = RevisionNote(
                document_id=doc_id,
                revision_type=revision_type,
                revision_json=revision_json,
                generated_by_model=model_name
            )
            db.add(db_note)
            db.commit()
            db.refresh(db_note)
            return db_note

    @staticmethod
    def delete_revision_notes(db: Session, doc_id: str) -> bool:
        db.query(RevisionNote).filter(RevisionNote.document_id == doc_id).delete()
        db.commit()
        return True
