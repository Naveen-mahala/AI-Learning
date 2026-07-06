import os
import sys
import unittest
import math
from fastapi.testclient import TestClient

# Add app folder to system path for running as a direct script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import engine, SessionLocal
from app.repositories.document_repo import DocumentRepository
from app.services.cloudinary_service import CloudinaryService

import fitz  # PyMuPDF to generate test PDFs

class TestPDFIngestionPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()
        cls.uploaded_doc_ids = []

    @classmethod
    def tearDownClass(cls):
        # Clean up any database records created during testing
        print("\n--- Cleaning up test records in database and Cloudinary ---")
        for doc_id in cls.uploaded_doc_ids:
            try:
                # Retrieve document to get public_id
                doc = DocumentRepository.get_document(cls.db, doc_id)
                if doc:
                    print(f"Deleting test document {doc_id} (Cloudinary ID: {doc.cloudinary_public_id})...")
                    if doc.cloudinary_public_id:
                        CloudinaryService.delete_pdf(doc.cloudinary_public_id)
                    DocumentRepository.delete_document(cls.db, doc_id)
            except Exception as e:
                print(f"Error cleaning up doc {doc_id}: {str(e)}")
        cls.db.close()

    def test_01_upload_small_pdf(self):
        print("\n=== Test 1: Upload Small 1-Page PDF ===")
        # Generate 1-page PDF
        pdf_path = "test_small.pdf"
        doc = fitz.open()
        page = doc.new_page()
        text = "Hello World! This is a simple test of the Day 8 PDF Knowledge Ingestion Pipeline. It has some hyphen-ated splits."
        page.insert_text((50, 50), text)
        doc.save(pdf_path)
        doc.close()

        try:
            with open(pdf_path, "rb") as f:
                response = self.client.post(
                    "/api/upload-pdf",
                    files={"file": (pdf_path, f, "application/pdf")}
                )
            
            self.assertEqual(response.status_code, 201)
            data = response.json()
            print("Response:", data)
            self.assertTrue(data["success"])
            self.assertIn("document_id", data)
            self.assertEqual(data["pages"], 1)
            # Word count should be approx 20 words
            self.assertGreater(data["words"], 0)
            self.uploaded_doc_ids.append(data["document_id"])
        finally:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

    def test_02_upload_multipage_pdf(self):
        print("\n=== Test 2: Upload Multi-Page PDF ===")
        # Generate 3-page PDF
        pdf_path = "test_multipage.pdf"
        doc = fitz.open()
        
        page1 = doc.new_page()
        page1.insert_text((50, 50), "This is page number one. It contains some text content.")
        
        page2 = doc.new_page()
        page2.insert_text((50, 50), "This is page number two. We are testing multi-page text extraction.")
        
        page3 = doc.new_page()
        page3.insert_text((50, 50), "This is the final page, page number three.")
        
        doc.save(pdf_path)
        doc.close()

        try:
            with open(pdf_path, "rb") as f:
                response = self.client.post(
                    "/api/upload-pdf",
                    files={"file": (pdf_path, f, "application/pdf")}
                )
            
            self.assertEqual(response.status_code, 201)
            data = response.json()
            print("Response:", data)
            self.assertTrue(data["success"])
            self.assertEqual(data["pages"], 3)
            self.assertGreater(data["words"], 10)
            self.uploaded_doc_ids.append(data["document_id"])
            
            # Fetch document detail to verify text preview and estimated reading time
            doc_id = data["document_id"]
            detail_response = self.client.get(f"/api/document/{doc_id}")
            self.assertEqual(detail_response.status_code, 200)
            detail_data = detail_response.json()
            print("Detail Response:", detail_data)
            self.assertEqual(detail_data["page_count"], 3)
            self.assertIsNotNone(detail_data["text_preview"])
            self.assertGreater(len(detail_data["text_preview"]), 20)
            self.assertGreater(detail_data["word_count"], 10)
            self.assertGreaterEqual(detail_data["estimated_reading_time"], 1)
        finally:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

    def test_03_upload_empty_pdf(self):
        print("\n=== Test 3: Upload Empty PDF ===")
        # Generate PDF with 2 empty pages
        pdf_path = "test_empty.pdf"
        doc = fitz.open()
        doc.new_page()
        doc.new_page()
        doc.save(pdf_path)
        doc.close()

        try:
            with open(pdf_path, "rb") as f:
                response = self.client.post(
                    "/api/upload-pdf",
                    files={"file": (pdf_path, f, "application/pdf")}
                )
            
            self.assertEqual(response.status_code, 201)
            data = response.json()
            print("Response:", data)
            self.assertTrue(data["success"])
            self.assertEqual(data["pages"], 2)
            self.assertEqual(data["words"], 0)
            self.uploaded_doc_ids.append(data["document_id"])
        finally:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

    def test_04_upload_invalid_extension(self):
        print("\n=== Test 4: Reject Invalid File Format ===")
        text_path = "test_invalid.txt"
        with open(text_path, "w") as f:
            f.write("This is a plain text file, not a PDF.")

        try:
            with open(text_path, "rb") as f:
                response = self.client.post(
                    "/api/upload-pdf",
                    files={"file": (text_path, f, "text/plain")}
                )
            
            self.assertEqual(response.status_code, 400)
            data = response.json()
            print("Response details:", data)
            self.assertIn("Only PDF is allowed", data["detail"])
        finally:
            if os.path.exists(text_path):
                os.remove(text_path)

    def test_05_upload_too_large_pdf(self):
        print("\n=== Test 5: Reject Oversized PDF (>25MB) ===")
        pdf_path = "test_oversized.pdf"
        
        # Create a file of 26MB (26 * 1024 * 1024 bytes) in under a millisecond
        with open(pdf_path, "wb") as f:
            f.truncate(26 * 1024 * 1024 + 100)

        try:
            with open(pdf_path, "rb") as f:
                response = self.client.post(
                    "/api/upload-pdf",
                    files={"file": (pdf_path, f, "application/pdf")}
                )
            
            self.assertEqual(response.status_code, 400)
            data = response.json()
            print("Response details:", data)
            self.assertIn("exceeds the 25MB limit", data["detail"])
        finally:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

    def test_06_list_documents(self):
        print("\n=== Test 6: List Documents ===")
        response = self.client.get("/api/documents")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        print(f"Total documents found in DB: {len(data)}")
        self.assertGreaterEqual(len(data), 2)
        # Check first element attributes
        first_doc = data[0]
        self.assertIn("title", first_doc)
        self.assertIn("filename", first_doc)
        self.assertIn("cloudinary_url", first_doc)
        self.assertIn("word_count", first_doc)

if __name__ == "__main__":
    unittest.main()
