import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add app folder to system path for running as a direct script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import SessionLocal
from app.repositories.document_repo import DocumentRepository
from app.repositories.important_question_repo import ImportantQuestionRepository

class TestImportantQuestionsGenerator(unittest.TestCase):
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
            ImportantQuestionRepository.delete_questions(cls.db, cls.test_doc.id)
            DocumentRepository.delete_document(cls.db, cls.test_doc.id)
        cls.db.close()

    def test_01_generate_mixed_mode(self):
        print("\n=== Test 1: Generate Mixed Mode Important Questions ===")
        doc_id = self.test_doc.id
        
        # Trigger generation via endpoint
        response = self.client.post(
            f"/api/document/{doc_id}/generate-important-questions?question_mode=Mixed Mode"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["document_id"], doc_id)
        self.assertEqual(data["question_mode"], "Mixed Mode")
        self.assertIn("questions_json", data)
        
        questions_json = data["questions_json"]
        self.assertIn("document_title", questions_json)
        self.assertIn("question_count", questions_json)
        self.assertIn("questions", questions_json)
        
        questions = questions_json["questions"]
        self.assertTrue(len(questions) > 0)
        
        first_q = questions[0]
        self.assertIn("question", first_q)
        self.assertIn("type", first_q)
        self.assertIn("importance_score", first_q)
        self.assertIn("reason", first_q)
        self.assertIn("answer_outline", first_q)
        
        print(f"Success! Generated {len(questions)} questions.")

    def test_02_get_mixed_mode(self):
        print("\n=== Test 2: Get Generated Mixed Mode Important Questions ===")
        doc_id = self.test_doc.id
        
        response = self.client.get(
            f"/api/document/{doc_id}/important-questions?question_mode=Mixed Mode"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["question_mode"], "Mixed Mode")
        self.assertIn("questions_json", data)

    def test_03_invalid_mode(self):
        print("\n=== Test 3: Generate Invalid Mode ===")
        doc_id = self.test_doc.id
        response = self.client.post(
            f"/api/document/{doc_id}/generate-important-questions?question_mode=InvalidMode"
        )
        self.assertEqual(response.status_code, 400)

if __name__ == "__main__":
    unittest.main()
