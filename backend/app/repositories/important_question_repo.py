from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.important_question import ImportantQuestion

class ImportantQuestionRepository:
    @staticmethod
    def get_questions(db: Session, doc_id: str, question_mode: str) -> Optional[ImportantQuestion]:
        return db.query(ImportantQuestion).filter(
            ImportantQuestion.document_id == doc_id,
            ImportantQuestion.question_mode == question_mode
        ).first()

    @staticmethod
    def list_questions(db: Session, doc_id: str) -> List[ImportantQuestion]:
        return db.query(ImportantQuestion).filter(ImportantQuestion.document_id == doc_id).all()

    @staticmethod
    def create_or_update_questions(
        db: Session,
        doc_id: str,
        question_mode: str,
        questions_json: dict,
        model_name: str
    ) -> ImportantQuestion:
        # Check if one already exists
        existing = db.query(ImportantQuestion).filter(
            ImportantQuestion.document_id == doc_id,
            ImportantQuestion.question_mode == question_mode
        ).first()
        if existing:
            existing.questions_json = questions_json
            existing.generated_by_model = model_name
            db.commit()
            db.refresh(existing)
            return existing
        else:
            db_questions = ImportantQuestion(
                document_id=doc_id,
                question_mode=question_mode,
                questions_json=questions_json,
                generated_by_model=model_name
            )
            db.add(db_questions)
            db.commit()
            db.refresh(db_questions)
            return db_questions

    @staticmethod
    def delete_questions(db: Session, doc_id: str) -> bool:
        db.query(ImportantQuestion).filter(ImportantQuestion.document_id == doc_id).delete()
        db.commit()
        return True
