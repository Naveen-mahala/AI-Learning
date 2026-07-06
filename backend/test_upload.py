import os
import sys
import time
import requests

# Ensure requests is installed for testing (already standard on systems, or we can use urllib)
# But requests should be installed or we can install it.
# Let's create a test PDF first.
try:
    import fitz
except ImportError:
    print("Error: PyMuPDF is required to generate the test PDF.")
    sys.exit(1)

print("==================================================")
print("     STARTING END-TO-END PIPELINE TEST")
print("==================================================")

# 1. Create a sample PDF file programmatically
pdf_path = "test_sample.pdf"
print(f"Generating test PDF file: {pdf_path}...")
doc = fitz.open()
page = doc.new_page()

test_text = """
Day 8 Ingestion Pipeline Test Document
--------------------------------------------------
This is page 1 content.
We are testing the clean_text normalization utility.
It should merge hyphen-
ated splits such as object-
oriented design.
It should also remove multi-space    gaps and control characters \x01\x02.

Let's verify database storage and Cloudinary raw PDF mapping.
"""
page.insert_text((50, 50), test_text)

# Add page 2 to verify multi-page extraction
page2 = doc.new_page()
test_text2 = """
Ingestion Pipeline Test Document - Page 2
--------------------------------------------------
This is page 2 content.
All page content should be stored separately with page_number mapping.
If everything works, the document status will transition to 'completed' and confetti will show on the frontend!
"""
page2.insert_text((50, 50), test_text2)

doc.save(pdf_path)
doc.close()
print("Test PDF generated successfully.")

# 2. Upload to the FastAPI server running on localhost:8000
upload_url = "http://localhost:8000/api/documents/upload"
print(f"\nUploading to API: {upload_url}...")
try:
    with open(pdf_path, "rb") as f:
        files = {"file": ("test_sample.pdf", f, "application/pdf")}
        response = requests.post(upload_url, files=files)
except Exception as e:
    print("Could not connect to FastAPI server. Ensure it is running on http://localhost:8000")
    print("Error details:", str(e))
    sys.exit(1)

if response.status_code == 201:
    data = response.json()
    doc_id = data["document_id"]
    print(f"Upload API call: SUCCESS (Status Code 201)")
    print(f"Assigned Document ID: {doc_id}")
    
    # 3. Poll document status and processing logs
    print("\nPolling backend processing status...")
    attempts = 0
    while attempts < 30:
        attempts += 1
        status_res = requests.get(f"http://localhost:8000/api/documents/{doc_id}")
        if status_res.status_code == 200:
            doc_info = status_res.json()
            status = doc_info["upload_status"]
            print(f"Poll #{attempts} - Current Status: {status}")
            
            # Print latest logs
            print("Processing Logs:")
            for log in doc_info.get("logs", []):
                print(f"  [{log['status']}] {log['message']}")
                
            if status in ["completed", "failed"]:
                print(f"\nIngestion finished with state: {status}")
                if status == "completed":
                    print("Test document verified successfully!")
                    
                    # Print preview of page content stored
                    print("\nStored Page Content Preview:")
                    for page_content in doc_info.get("contents", []):
                        print(f"--- Page {page_content['page_number']} ---")
                        print(page_content["content"][:200] + "...")
                else:
                    print("Ingestion failed. Check error logs above.")
                break
        else:
            print("Failed to fetch document status:", status_res.text)
            break
        time.sleep(1.5)
else:
    print(f"Upload failed with HTTP {response.status_code}!")
    print("Response detail:", response.text)

# Cleanup local test file
if os.path.exists(pdf_path):
    os.remove(pdf_path)
    print("\nCleaned up local test PDF file.")

print("==================================================")
