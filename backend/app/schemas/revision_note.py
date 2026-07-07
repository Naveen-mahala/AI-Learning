from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime

class RevisionNoteCreate(BaseModel):
    revision_type: str  # "5 mins", "10 mins", "20 mins"

class RevisionNoteResponse(BaseModel):
    id: int
    document_id: str
    revision_type: str
    revision_json: Dict[str, Any]
    generated_by_model: str
    created_at: datetime

    class Config:
        from_attributes = True
