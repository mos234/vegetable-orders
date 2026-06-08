"""
scan_server.py — Flask API for invoice scanning and item extraction.
Supports image files (JPG, PNG, GIF, BMP) and PDF documents.
Uses OCR (Tesseract) for text extraction and Gemma (via Ollama) for intelligent parsing.
Falls back to regex-based parsing when AI is unavailable.
"""

import io
import re
import json
import datetime
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract



app = Flask(__name__)
CORS(app)

app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10MB

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".pdf"}


def _allowed_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


# ---------------------------------------------------------------------------
# 1. Text Extraction
# ---------------------------------------------------------------------------

def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract text from an image or PDF file."""
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        return _extract_text_from_pdf(file_bytes)
    return _extract_text_from_image(file_bytes)


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    from pdf2image import convert_from_bytes
    images = convert_from_bytes(file_bytes, dpi=200)
    text = ""
    for img in images:
        text += pytesseract.image_to_string(img, lang="heb+eng") + "\n"
    return text


def _extract_text_from_image(file_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(img, lang="heb+eng")


# ---------------------------------------------------------------------------
# 2. Text Cleaning
# ---------------------------------------------------------------------------

def clean_text(text: str) -> str:
    """Normalize quotes, apostrophes, whitespace, and blank lines."""
    # Normalize double quotes: ״ (Hebrew gershayim) and " (smart quote) → "
    text = text.replace("״", '"').replace("\u201c", '"').replace("\u201d", '"')

    # Normalize single quotes: ׳ (Hebrew geresh) and ' (smart quote) → '
    text = text.replace("׳", "'").replace("\u2018", "'").replace("\u2019", "'")

    # Collapse multiple spaces into one
    text = re.sub(r"[ \t]{2,}", " ", text)

    # Collapse multiple blank lines into one
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


# ---------------------------------------------------------------------------
# 3. AI Parsing (Gemma via Ollama)
# ---------------------------------------------------------------------------

def _repair_json(raw: str) -> str:
    """Attempt to fix common JSON issues."""
    # Remove markdown fences
    raw = re.sub(r"```json\s*", "", raw)
    raw = re.sub(r"```\s*", "", raw)

    # Remove trailing commas before } or ]
    raw = re.sub(r",\s*([}\]])", r"\1", raw)

    return raw.strip()


def parse_with_gemma(raw_text: str, retries: int = 2) -> dict | None:
    """Parse invoice text using Gemma model through Ollama."""
    try:
        import ollama
    except ImportError:
        return None

    prompt = (
        "אתה מומחה לניתוח חשבוניות וקבלות.\n"
        "נתח את הטקסט הבא וחלץ את הפריטים.\n"
        "החזר JSON בלבד, ללא טקסט נוסף, במבנה הבא:\n"
        "{\n"
        '  "items": [\n'
        '    {"name": "שם המוצר", "quantity": 1, "unit": "יחידה", '
        '"price": 0.0, "confidence": 0.9}\n'
        "  ],\n"
        '  "supplierName": "שם הספק או ריק",\n'
        '  "totalAmount": 0,\n'
        '  "documentDate": "YYYY-MM-DD"\n'
        "}\n\n"
        "כללים:\n"
        "- confidence בין 0 ל-1\n"
        "- אם אין מידע מספיק, השתמש בערכים ריקים\n"
        "- תמיד החזר JSON תקין\n\n"
        f"טקסט החשבונית:\n{raw_text}"
    )

    for attempt in range(retries + 1):
        try:
            response = ollama.chat(
                model="gemma3:4b",
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.1},
            )
            content = response["message"]["content"]
            repaired = _repair_json(content)
            result = json.loads(repaired)
            result["usedAI"] = True
            return result
        except (json.JSONDecodeError, KeyError, TypeError):
            if attempt == retries:
                return None
            continue
        except Exception:
            return None

    return None


# ---------------------------------------------------------------------------
# 4. Regex Fallback Parsing
# ---------------------------------------------------------------------------

_UNITS = r"ק\"ג|יח'|קרטון|שק|ארגז|חבילה"

# Pattern 1: name  quantity  unit  price
_PATTERN_1 = re.compile(
    rf"([א-תa-zA-Z\s]{{2,}}?)\s+"
    rf"(\d+(?:\.\d+)?)\s+"
    rf"({_UNITS})\s+"
    rf"(\d+(?:\.\d+)?)",
    re.MULTILINE,
)

# Pattern 2: quantity  unit  name
_PATTERN_2 = re.compile(
    rf"(\d+(?:\.\d+)?)\s+"
    rf"({_UNITS})\s+"
    rf"([א-תa-zA-Z\s]{{2,}})",
    re.MULTILINE,
)


def parse_with_regex(raw_text: str) -> dict:
    """Fallback parser using regex patterns."""
    items: list[dict] = []
    seen_names: set[str] = set()

    # Try Pattern 1
    for match in _PATTERN_1.finditer(raw_text):
        name = match.group(1).strip()
        quantity = float(match.group(2))
        unit = match.group(3)
        price = float(match.group(4))

        if _should_skip(name, seen_names):
            continue

        seen_names.add(name)
        items.append({
            "name": name,
            "quantity": quantity,
            "unit": unit,
            "price": price,
            "confidence": 0.5,
        })

    # Try Pattern 2
    for match in _PATTERN_2.finditer(raw_text):
        quantity = float(match.group(1))
        unit = match.group(2)
        name = match.group(3).strip()

        if _should_skip(name, seen_names):
            continue

        seen_names.add(name)
        items.append({
            "name": name,
            "quantity": quantity,
            "unit": unit,
            "price": 0,
            "confidence": 0.5,
        })

    return {
        "items": items,
        "supplierName": "",
        "totalAmount": 0,
        "documentDate": "",
        "usedAI": False,
    }


def _should_skip(name: str, seen: set[str]) -> bool:
    """Skip names that are too short, purely numeric, or duplicates."""
    if len(name) < 2:
        return True
    if name.replace(".", "").replace(",", "").isdigit():
        return True
    if name in seen:
        return True
    return False


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return jsonify({"status": "ok"})


MAX_TEXT_FOR_AI = 3000

@app.post("/scan")
def scan():
    if "file" not in request.files:
        return jsonify({"error": "לא נמצא קובץ"}), 400

    file = request.files["file"]
    if not file.filename or not _allowed_file(file.filename):
        return jsonify({"error": "סוג קובץ לא נתמך"}), 400

    file_bytes = file.read()

    raw_text = extract_text(file_bytes, file.filename)
    cleaned = clean_text(raw_text)

    # חתוך לGemma אם הטקסט ארוך מדי
    text_for_ai = cleaned[:MAX_TEXT_FOR_AI] if len(cleaned) > MAX_TEXT_FOR_AI else cleaned

    result = parse_with_gemma(text_for_ai)
    if result is None:
        result = parse_with_regex(cleaned)

    result["rawText"] = cleaned
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
