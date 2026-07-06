import io
import logging
from typing import List, Dict, Any, Tuple
from app.utils.text_cleaner import clean_text

logger = logging.getLogger(__name__)

class ExtractionService:
    @staticmethod
    def extract_pdf(file_bytes: bytes) -> Tuple[List[Dict[str, Any]], Dict[str, Any], int]:
        """
        Extracts pages and metadata from a PDF.
        Tries PyMuPDF (fitz) first. If it fails or is not installed, falls back to pdfplumber.
        Returns:
            Tuple: (list of page dicts [{"page_number": int, "content": str}], metadata_dict, page_count)
        """
        # Try PyMuPDF
        try:
            import fitz  # PyMuPDF
            logger.info("Attempting PDF extraction using PyMuPDF...")
            return ExtractionService._extract_with_pymupdf(file_bytes)
        except ImportError:
            logger.warning("PyMuPDF (fitz) is not installed. Falling back to pdfplumber...")
        except Exception as e:
            logger.error(f"PyMuPDF extraction failed: {str(e)}. Falling back to pdfplumber...")

        # Fallback to pdfplumber
        try:
            import pdfplumber
            logger.info("Attempting PDF extraction using pdfplumber...")
            return ExtractionService._extract_with_pdfplumber(file_bytes)
        except ImportError:
            logger.error("Neither PyMuPDF nor pdfplumber is installed!")
            raise Exception("PDF extraction service unavailable: PyMuPDF and pdfplumber are missing.")
        except Exception as e:
            logger.error(f"pdfplumber extraction failed: {str(e)}")
            raise Exception(f"Failed to extract text from PDF: {str(e)}")

    @staticmethod
    def _extract_with_pymupdf(file_bytes: bytes) -> Tuple[List[Dict[str, Any]], Dict[str, Any], int]:
        import fitz
        
        # Open PDF from bytes stream
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        page_count = len(doc)
        
        # Extract metadata keys safely
        meta = doc.metadata or {}
        metadata = {
            "title": meta.get("title", ""),
            "author": meta.get("author", ""),
            "subject": meta.get("subject", ""),
            "creator": meta.get("creator", ""),
            "producer": meta.get("producer", ""),
            "creation_date": meta.get("creationDate", ""),
            "mod_date": meta.get("modDate", "")
        }
        
        pages = []
        for i in range(page_count):
            page = doc.load_page(i)
            raw_text = page.get_text() or ""
            cleaned = clean_text(raw_text)
            pages.append({
                "page_number": i + 1,
                "content": cleaned
            })
            
        doc.close()
        return pages, metadata, page_count

    @staticmethod
    def _extract_with_pdfplumber(file_bytes: bytes) -> Tuple[List[Dict[str, Any]], Dict[str, Any], int]:
        import pdfplumber
        
        pages = []
        metadata = {}
        
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            page_count = len(pdf.pages)
            
            # Extract metadata
            meta = pdf.metadata or {}
            metadata = {
                "title": meta.get("Title", ""),
                "author": meta.get("Author", ""),
                "subject": meta.get("Subject", ""),
                "creator": meta.get("Creator", ""),
                "producer": meta.get("Producer", ""),
                "creation_date": meta.get("CreationDate", ""),
                "mod_date": meta.get("ModDate", "")
            }
            
            for i, page in enumerate(pdf.pages):
                raw_text = page.extract_text() or ""
                cleaned = clean_text(raw_text)
                pages.append({
                    "page_number": i + 1,
                    "content": cleaned
                })
                
        return pages, metadata, page_count
