"""Extract text from uploaded PDF knowledge documents."""

from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import fitz
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.enums import DocumentStatus
from app.models.knowledge_document import KnowledgeDocument


class DocumentProcessingError(Exception):
    """Raised when a PDF cannot be read or contains no extractable text."""


@dataclass(frozen=True)
class PdfExtractionResult:
    """Text extracted from a PDF file."""

    page_count: int
    text: str


def extract_pdf_text(file_path: Path) -> PdfExtractionResult:
    """Read a PDF from disk and return its page count and extracted text."""
    try:
        with fitz.open(file_path) as pdf:
            page_count = pdf.page_count
            if page_count == 0:
                raise DocumentProcessingError("PDF contains no pages")

            page_texts: list[str] = []
            for page_number in range(page_count):
                page_texts.append(pdf[page_number].get_text("text"))

            text = "\n".join(page_texts).strip()
    except DocumentProcessingError:
        raise
    except Exception as exc:
        raise DocumentProcessingError(f"Failed to read PDF: {exc}") from exc

    if not text:
        raise DocumentProcessingError("No extractable text found in PDF")

    return PdfExtractionResult(page_count=page_count, text=text)


def process_document(
    db: Session,
    settings: Settings,
    document: KnowledgeDocument,
) -> KnowledgeDocument:
    """Extract text from a document's PDF and update processing metadata."""
    if document.status == DocumentStatus.PROCESSING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document is already being processed",
        )

    file_path = Path(settings.upload_dir) / document.file_path
    if not file_path.is_file():
        return _mark_failed(db, document, "PDF file not found on disk")

    document.status = DocumentStatus.PROCESSING
    document.error_message = None
    db.commit()
    db.refresh(document)

    try:
        extraction = extract_pdf_text(file_path)
    except DocumentProcessingError as exc:
        return _mark_failed(db, document, str(exc))

    document.status = DocumentStatus.READY
    document.page_count = extraction.page_count
    document.processed_at = datetime.now(UTC)
    document.error_message = None
    db.commit()
    db.refresh(document)
    return document


def _mark_failed(
    db: Session,
    document: KnowledgeDocument,
    error_message: str,
) -> KnowledgeDocument:
    """Persist a failed processing state."""
    document.status = DocumentStatus.FAILED
    document.error_message = error_message
    document.processed_at = None
    db.commit()
    db.refresh(document)
    return document
