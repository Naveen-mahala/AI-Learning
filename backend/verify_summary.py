import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models.document import DocumentSummary, Document, DocumentContent
from app.services.ai_service import AIManager
from sqlalchemy.orm import sessionmaker

print("==================================================")
print("           SMART SUMMARY PIPELINE TEST            ")
print("==================================================")

print("1. Initializing DB tables (creating document_summaries)...")
try:
    Base.metadata.create_all(bind=engine)
    print("DB tables initialized successfully!")
except Exception as e:
    print("Failed to initialize database tables:", str(e))
    sys.exit(1)

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("\n2. Fetching a document from Neon database...")
doc = db.query(Document).first()
if not doc:
    print("No documents found in DB. Please upload a PDF through the upload page first.")
    db.close()
    sys.exit(0)

print(f"Found document: '{doc.title}' (ID: {doc.id})")
if not doc.contents or not doc.contents[0].raw_text:
    print("Error: The document has no extracted raw_text content.")
    db.close()
    sys.exit(0)

raw_text = doc.contents[0].raw_text
print(f"Extracted content size: {len(raw_text)} characters.")

print("\n3. Generating Smart Summary using AIManager (Gemini 2.5 Flash)...")
try:
    summary_json = AIManager.generate_summary(doc.title, raw_text)
    print("AI API execution: SUCCESS!")
    print(f"Generated Title: '{summary_json.get('title')}'")
    print(f"Learning Time: '{summary_json.get('estimated_learning_time')}'")
    
    print("\nChecking schema structure keys:")
    expected_keys = [
        "title", "estimated_learning_time", "overview", 
        "must_know_concepts", "key_takeaways", "real_world_examples", 
        "important_terms", "common_mistakes", "quick_revision", "self_test_questions"
    ]
    for key in expected_keys:
        status = "OK" if key in summary_json else "MISSING ❌"
        print(f"  - {key}: {status}")
        
except Exception as e:
    print("AI Summary Generation failed!")
    print("Error details:", str(e))

db.close()
print("\n==================================================")
