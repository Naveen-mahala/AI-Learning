from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime

class ImportantQuestionCreate(BaseModel):
    question_mode: str  # "Exam Mode", "Interview Mode", "Viva Mode", "Mixed Mode"

class ImportantQuestionResponse(BaseModel):
    id: int
    document_id: str
    question_mode: str
    questions_json: Dict[str, Any]
    generated_by_model: str
    created_at: datetime

    class Config:
        from_attributes = True
