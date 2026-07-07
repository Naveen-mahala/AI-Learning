import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add app folder to system path for running as a direct script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import engine, SessionLocal
from app.repositories.document_repo import DocumentRepository
from app.repositories.concept_repo import ConceptRepository
from app.services.cloudinary_service import CloudinaryService

import fitz  # PyMuPDF to generate test PDFs

class TestConceptExtractionEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()
        cls.uploaded_doc_ids = []

    @classmethod
    def tearDownClass(cls):
        print("\n--- Cleaning up test records in database and Cloudinary ---")
        for doc_id in cls.uploaded_doc_ids:
            try:
                # Retrieve document to get public_id
                doc = DocumentRepository.get_document(cls.db, doc_id)
                if doc:
                    print(f"Deleting test document {doc_id} (Cloudinary ID: {doc.cloudinary_public_id})...")
                    if doc.cloudinary_public_id:
                        CloudinaryService.delete_pdf(doc.cloudinary_public_id)
                    # This cascades and deletes concepts and relationships too
                    DocumentRepository.delete_document(cls.db, doc_id)
            except Exception as e:
                print(f"Error cleaning up doc {doc_id}: {str(e)}")
        cls.db.close()

    def test_01_concept_extraction_pipeline(self):
        print("\n=== Test 1: Ingestion & Concept Extraction ===")
        # 1. Create a mock Machine Learning notes PDF
        pdf_path = "test_ml_notes.pdf"
        doc = fitz.open()
        page = doc.new_page()
        
        # Educational content suitable for concept extraction
        content = """
        Machine Learning Notes:
        Machine Learning is a subset of Artificial Intelligence that allows systems to learn from data.
        A Core Concept is Supervised Learning, which trains models on labeled datasets.
        A Sub Concept of Supervised Learning is Regression, specifically Linear Regression, which predicts continuous output values.
        Another Sub Concept is Classification, like Logistic Regression or Decision Trees, which predict categorical outcomes.
        An Advanced Concept is Overfitting, which occurs when a model learns the training data too well, failing to generalize to new data.
        A related topic is Underfitting, where the model is too simple to capture the underlying pattern of the data.
        """
        page.insert_text((50, 50), content)
        doc.save(pdf_path)
        doc.close()

        try:
            # 2. Upload to ingestion pipeline
            with open(pdf_path, "rb") as f:
                upload_res = self.client.post(
                    "/api/upload-pdf",
                    files={"file": (pdf_path, f, "application/pdf")}
                )
            self.assertEqual(upload_res.status_code, 201)
            upload_data = upload_res.json()
            doc_id = upload_data["document_id"]
            self.uploaded_doc_ids.append(doc_id)
            print(f"Uploaded test document ID: {doc_id}")

            # 3. Trigger Concept Extraction
            # We use default AI provider setup
            extract_res = self.client.post(f"/api/document/{doc_id}/extract-concepts")
            self.assertEqual(extract_res.status_code, 201)
            extract_data = extract_res.json()
            
            self.assertTrue(extract_data["success"])
            self.assertEqual(extract_data["document_id"], doc_id)
            self.assertGreater(extract_data["extracted_count"], 0)
            print(f"Extracted {extract_data['extracted_count']} concepts.")

            # 4. Fetch all concepts for document
            concepts_res = self.client.get(f"/api/document/{doc_id}/concepts")
            self.assertEqual(concepts_res.status_code, 200)
            concepts_data = concepts_res.json()
            
            self.assertEqual(concepts_data["document_id"], doc_id)
            self.assertGreater(len(concepts_data["concepts"]), 0)
            self.assertGreater(len(concepts_data["relationships"]), 0)
            
            print("\nExtracted Concepts List:")
            for concept in concepts_data["concepts"]:
                print(f"- {concept['name']} ({concept['category']}) | Importance: {concept['importance_score']}")
            
            print("\nExtracted Relationships List:")
            for rel in concepts_data["relationships"]:
                print(f"Source ID: {rel['source_concept_id']} -> Target ID: {rel['target_concept_id']} ({rel['relationship_type']})")

            # 5. Fetch detail of the first concept
            first_concept_id = concepts_data["concepts"][0]["id"]
            detail_res = self.client.get(f"/api/concept/{first_concept_id}")
            self.assertEqual(detail_res.status_code, 200)
            detail_data = detail_res.json()
            
            self.assertEqual(detail_data["id"], first_concept_id)
            self.assertIsNotNone(detail_data["name"])
            self.assertIsNotNone(detail_data["definition"])
            # Relationships lists should be populated or at least be empty arrays, not None
            self.assertIsInstance(detail_data["sub_concepts"], list)
            self.assertIsInstance(detail_data["related_concepts"], list)
            self.assertIsInstance(detail_data["prerequisite_concepts"], list)
            print(f"\nFetched details for '{detail_data['name']}':")
            print(f"Definition: {detail_data['definition']}")
            print(f"Learning Tips: {detail_data['learning_tips']}")
            print(f"Sub-concepts: {[c['name'] for c in detail_data['sub_concepts']]}")

        finally:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

    def test_02_extract_concepts_invalid_document(self):
        print("\n=== Test 2: Handle Invalid Document ID ===")
        res = self.client.post("/api/document/nonexistent-id/extract-concepts")
        self.assertEqual(res.status_code, 404)
        self.assertIn("not found", res.json()["detail"])

    def test_03_extract_concepts_tiny_document(self):
        print("\n=== Test 3: Handle Tiny/Empty Document ===")
        # Create a tiny text PDF
        pdf_path = "test_tiny.pdf"
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), "Tiny text.")
        doc.save(pdf_path)
        doc.close()

        try:
            with open(pdf_path, "rb") as f:
                upload_res = self.client.post(
                    "/api/upload-pdf",
                    files={"file": (pdf_path, f, "application/pdf")}
                )
            self.assertEqual(upload_res.status_code, 201)
            doc_id = upload_res.json()["document_id"]
            self.uploaded_doc_ids.append(doc_id)

            # Trigger concept extraction should fail with 400 Bad Request
            extract_res = self.client.post(f"/api/document/{doc_id}/extract-concepts")
            self.assertEqual(extract_res.status_code, 400)
            self.assertIn("not contain enough text content", extract_res.json()["detail"])

        finally:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

if __name__ == "__main__":
    unittest.main()
