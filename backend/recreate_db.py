import os
import sys

# Add app folder to system path for running as a direct script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models.document import Document, DocumentContent, DocumentProcessingLog, DocumentSummary
from app.models.concept import Concept, ConceptRelationship

def recreate_database():
    print("Connecting to database...")
    try:
        # Drop all tables
        print("Dropping existing tables...")
        Base.metadata.drop_all(bind=engine)
        print("Existing tables dropped successfully.")
        
        # Create all tables
        print("Creating all tables from scratch...")
        Base.metadata.create_all(bind=engine)
        print("Database tables recreated successfully.")
        
    except Exception as e:
        print("Error recreating database:", str(e))
        sys.exit(1)

if __name__ == "__main__":
    recreate_database()
