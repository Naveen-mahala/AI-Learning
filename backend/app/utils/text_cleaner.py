import re
import unicodedata

def clean_text(text: str) -> str:
    """
    Cleans and normalizes text extracted from PDF.
    - Removes control characters except newline and tab.
    - Resolves broken lines (hyphenated word splits).
    - Normalizes unicode characters.
    - Removes repeated whitespaces and trims lines.
    """
    if not text:
        return ""
    
    # 1. Normalize unicode characters (NFKC format)
    text = unicodedata.normalize("NFKC", text)
    
    # 2. Remove control characters (excluding newline and tab)
    # Range \x00-\x1f and \x7f-\x9f
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    # 3. Rejoin hyphenated words split by line breaks
    # e.g., "intro-\nduction" -> "introduction"
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
    
    # 4. Replace repeated spaces and tabs with a single space
    text = re.sub(r'[ \t]+', ' ', text)
    
    # 5. Normalize multiple newlines (3 or more) to a double newline
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # 6. Trim leading/trailing whitespace from each line and rejoin
    lines = [line.strip() for line in text.splitlines()]
    
    # Filter empty lines to prevent excessive vertical spacing
    cleaned_lines = []
    for i, line in enumerate(lines):
        if line:
            cleaned_lines.append(line)
        elif i > 0 and lines[i-1]:  # Keep at most one blank line as a paragraph separator
            cleaned_lines.append("")
            
    text = "\n".join(cleaned_lines)
    
    return text.strip()
