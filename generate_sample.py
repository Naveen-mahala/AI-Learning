import fitz  # PyMuPDF

def generate_pdf():
    pdf_path = "f:\\AI Learning\\sample.pdf"
    print(f"Generating test PDF file: {pdf_path}...")
    doc = fitz.open()
    page = doc.new_page()
    text = """
    AI Learning Ingestion Pipeline Verification
    ===========================================
    This is a test PDF document generated programmatically.
    It contains multiple words to ensure that word count is calculated correctly.
    The pipeline is designed to extract text page by page, combine content, clean text,
    calculate stats (page count, word count, character count, reading time) and store it in Neon.
    """
    page.insert_text((50, 50), text)
    doc.save(pdf_path)
    doc.close()
    print("PDF generated successfully.")

if __name__ == "__main__":
    generate_pdf()
