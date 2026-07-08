import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.document_repo import DocumentRepository
from app.repositories.important_question_repo import ImportantQuestionRepository
from app.services.ai_service import AIManager, AIProviderError

logger = logging.getLogger(__name__)

class ImportantQuestionService:
    @staticmethod
    def generate_questions_sync(
        db: Session, 
        doc_id: str, 
        question_mode: str, 
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synchronously runs the Important Questions Generation Pipeline:
        1. Retrieve document metadata and raw text.
        2. Validate document length.
        3. Call AIManager to generate questions JSON.
        4. Save to DB under important_questions.
        """
        # 1. Retrieve document
        doc = DocumentRepository.get_document(db, doc_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {doc_id} not found."
            )

        # 2. Validate content
        if not doc.contents or not doc.contents[0].raw_text or len(doc.contents[0].raw_text.strip()) < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This document does not contain enough text content to generate important questions."
            )

        raw_text = doc.contents[0].raw_text

        # Log progress
        DocumentRepository.log_processing_step(
            db, doc_id, "generating_questions", f"Important questions generation triggered for mode: {question_mode}."
        )

        try:
            # 3. Call AI Service
            questions_data = AIManager.generate_important_questions(
                title=doc.title, 
                text=raw_text, 
                question_mode=question_mode, 
                provider_name=provider
            )

            # Resolve model name
            actual_provider = AIManager.get_provider(provider)
            model_name = type(actual_provider).__name__.replace("Provider", "")

            # 4. Save to DB
            db_questions = ImportantQuestionRepository.create_or_update_questions(
                db=db,
                doc_id=doc_id,
                question_mode=question_mode,
                questions_json=questions_data,
                model_name=model_name
            )

            DocumentRepository.log_processing_step(
                db, doc_id, "completed", f"Important questions ({question_mode}) generated successfully."
            )

            return db_questions

        except AIProviderError as pe:
            logger.error(f"AI provider failed: {str(pe)}")
            DocumentRepository.log_processing_step(
                db, doc_id, "failed", f"Important questions generation failed: {str(pe)}"
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI Service Failure: {str(pe)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error during questions generation: {str(e)}")
            DocumentRepository.log_processing_step(
                db, doc_id, "failed", f"Unexpected important questions error: {str(e)}"
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An unexpected error occurred: {str(e)}"
            )
