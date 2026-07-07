import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add app folder to system path for running as a direct script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import SessionLocal
from app.repositories.document_repo import DocumentRepository
from app.repositories.revision_note_repo import RevisionNoteRepository

class TestRevisionNotesGenerator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()
        
        # Check if there are any documents in the database
        cls.docs = DocumentRepository.list_documents(cls.db, limit=5)
        cls.test_doc = None
        for doc in cls.docs:
            if doc.processing_status == "completed" and doc.contents:
                cls.test_doc = doc
                break

        if not cls.test_doc:
            print("WARNING: No completed documents found. Creating a temporary test document directly in the database...")
            # Create a mock document for testing
            from app.schemas.document import DocumentCreate
            import uuid
            doc_id = str(uuid.uuid4())
            cls.test_doc = DocumentRepository.create_document(
                cls.db,
                DocumentCreate(
                    id=doc_id,
                    title="Machine Learning Basics for Tests",
                    filename="ml_basics.pdf",
                    cloudinary_url="https://res.cloudinary.com/dummy.pdf",
                    cloudinary_public_id="dummy_id",
                    file_size=1024,
                    processing_status="completed",
                    page_count=2,
                    estimated_reading_time=5
                )
            )
            DocumentRepository.add_document_content(
                cls.db,
                doc_id=doc_id,
                raw_text="""
                Machine learning is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks.
                It is seen as a part of artificial intelligence. Machine learning algorithms build a model based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so.
                Supervised learning is a type of machine learning where the model is trained on labeled data. For example, predicting house prices based on features like size and location. Regression and classification are key types of supervised learning.
                Unsupervised learning is where the model is trained on unlabeled data. It finds hidden patterns or intrinsic structures in input data. Clustering (like K-Means) and dimensionality reduction (like PCA) are common unsupervised learning techniques.
                Overfitting occurs when a machine learning model matches the training data too closely, learning its noise and outliers. As a result, it fails to generalize to new, unseen data, leading to poor validation and test performance.
                Underfitting occurs when the model is too simple to learn the underlying structure of the data, leading to poor performance on both training and test data.
                """,
                word_count=200,
                character_count=1200
            )
            cls.is_mock_doc = True
        else:
            cls.is_mock_doc = False
            print(f"Using existing completed document for test: {cls.test_doc.title} (ID: {cls.test_doc.id})")

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "is_mock_doc") and cls.is_mock_doc and cls.test_doc:
            print(f"Cleaning up temporary test document {cls.test_doc.id}...")
            # Delete revision notes first
            RevisionNoteRepository.delete_revision_notes(cls.db, cls.test_doc.id)
            DocumentRepository.delete_document(cls.db, cls.test_doc.id)
        cls.db.close()

    def test_01_generate_revision_5_mins(self):
        print("\n=== Test 1: Generate 5-Minute Revision Sheet ===")
        doc_id = self.test_doc.id
        
        # Trigger generation via endpoint
        response = self.client.post(
            f"/api/document/{doc_id}/generate-revision?revision_type=5 mins"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["document_id"], doc_id)
        self.assertEqual(data["revision_type"], "5 mins")
        self.assertIn("revision_json", data)
        
        rev_json = data["revision_json"]
        self.assertIn("title", rev_json)
        self.assertEqual(rev_json["estimated_revision_time"], "5 mins")
        self.assertIn("core_concepts", rev_json)
        self.assertIn("must_remember", rev_json)
        self.assertIn("important_definitions", rev_json)
        self.assertIn("important_questions", rev_json)
        self.assertIn("final_revision_sheet", rev_json)
        
        print("Success! Generated 5-Minute revision title:", rev_json["title"])

    def test_02_get_revision_5_mins(self):
        print("\n=== Test 2: Retrieve Saved 5-Minute Revision Sheet ===")
        doc_id = self.test_doc.id
        
        response = self.client.get(
            f"/api/document/{doc_id}/revision?revision_type=5 mins"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["document_id"], doc_id)
        self.assertEqual(data["revision_type"], "5 mins")
        self.assertIn("revision_json", data)
        print("Success! Retained 5-Minute revision.")

    def test_03_generate_revision_10_mins(self):
        print("\n=== Test 3: Generate 10-Minute Revision Sheet ===")
        doc_id = self.test_doc.id
        
        response = self.client.post(
            f"/api/document/{doc_id}/generate-revision?revision_type=10 mins"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["revision_type"], "10 mins")
        print("Success! Generated 10-Minute revision title:", data["revision_json"]["title"])

    def test_04_get_all_modes_from_db(self):
        print("\n=== Test 4: Retrieve List of All Generated Revisions ===")
        doc_id = self.test_doc.id
        
        revisions = RevisionNoteRepository.list_revision_notes(self.db, doc_id)
        self.assertGreaterEqual(len(revisions), 2)
        print(f"Success! Found {len(revisions)} total revisions saved in database for doc.")

if __name__ == "__main__":
    unittest.main()
