import os
import sys

# Add app folder to system path for running as a direct script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

print("==================================================")
print("           PDF PIPELINE CONFIG TEST")
print("==================================================")
print("Database URL loaded:", "YES" if settings.DATABASE_URL else "NO")
print("Cloudinary Cloud Name loaded:", "YES" if settings.CLOUDINARY_CLOUD_NAME else "NO")
print("Cloudinary API Key loaded:", "YES" if settings.CLOUDINARY_API_KEY else "NO")
print("Cloudinary API Secret loaded:", "YES" if settings.CLOUDINARY_API_SECRET else "NO")

print("\n--- Testing Database Connection ---")
try:
    from app.database import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
        if result == 1:
            print("Database connection test: SUCCESS (SELECT 1 returned 1)")
        else:
            print(f"Database connection test: UNEXPECTED RESULT (Returned {result})")
except Exception as e:
    print("Database connection test: FAILED!")
    print("Error details:", str(e))

print("\n--- Testing PDF Extractor Libraries ---")
try:
    import fitz  # PyMuPDF
    print("PyMuPDF (fitz) library: AVAILABLE")
except ImportError:
    print("PyMuPDF (fitz) library: NOT INSTALLED")
except Exception as e:
    print("PyMuPDF (fitz) library: FAILED TO LOAD -", str(e))

try:
    import pdfplumber
    print("pdfplumber library: AVAILABLE")
except ImportError:
    print("pdfplumber library: NOT INSTALLED")
except Exception as e:
    print("pdfplumber library: FAILED TO LOAD -", str(e))

print("\nVerification complete.")
print("==================================================")
