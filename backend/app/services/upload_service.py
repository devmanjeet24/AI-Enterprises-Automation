"""Save uploaded PDF files and create knowledge document records."""

import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.enums import DocumentStatus
from app.models.knowledge_document import KnowledgeDocument

PDF_MIME_TYPE = "application/pdf"
PDF_MAGIC_BYTES = b"%PDF"
ORIGINAL_FILENAME = "original.pdf"


class UploadService:
    """Handle PDF validation, disk storage, and KnowledgeDocument creation."""

    def __init__(self, settings: Settings) -> None:
        self._upload_root = Path(settings.upload_dir)
        self._max_bytes = settings.max_upload_size_mb * 1024 * 1024

    async def create_document_from_upload(
        self,
        db: Session,
        *,
        file: UploadFile,
        organization_id: uuid.UUID,
        uploaded_by_id: uuid.UUID,
        title: str | None,
        document_type: str | None,
    ) -> KnowledgeDocument:
        """Validate an uploaded PDF, save it to disk, and persist metadata."""
        original_filename = self._safe_original_filename(file.filename)
        self._validate_pdf_upload(file, original_filename)

        content = await file.read()
        self._validate_file_size(content)

        document_id = uuid.uuid4()
        relative_path = f"{organization_id}/{document_id}/{ORIGINAL_FILENAME}"
        absolute_path = self._upload_root / relative_path
        document_dir = absolute_path.parent

        document = KnowledgeDocument(
            id=document_id,
            organization_id=organization_id,
            uploaded_by_id=uploaded_by_id,
            title=self._resolve_title(title, original_filename),
            original_filename=original_filename,
            file_path=relative_path,
            file_size_bytes=len(content),
            mime_type=PDF_MIME_TYPE,
            document_type=document_type,
            status=DocumentStatus.PENDING,
        )

        try:
            document_dir.mkdir(parents=True, exist_ok=True)
            absolute_path.write_bytes(content)
            db.add(document)
            db.commit()
            db.refresh(document)
        except Exception:
            db.rollback()
            shutil.rmtree(document_dir, ignore_errors=True)
            raise

        return document

    def _safe_original_filename(self, filename: str | None) -> str:
        if not filename or not filename.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must include a filename",
            )
        return Path(filename.strip()).name

    def _validate_pdf_upload(self, file: UploadFile, original_filename: str) -> None:
        if not original_filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed",
            )

        content_type = (file.content_type or "").split(";", maxsplit=1)[0].strip().lower()
        if content_type and content_type not in {PDF_MIME_TYPE, "application/octet-stream"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed",
            )

    def _validate_file_size(self, content: bytes) -> None:
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty",
            )

        if len(content) > self._max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"File exceeds maximum upload size of {self._max_bytes // (1024 * 1024)} MB",
            )

        if not content.startswith(PDF_MAGIC_BYTES):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed",
            )

    def _resolve_title(self, title: str | None, original_filename: str) -> str:
        if title:
            return title
        stem = Path(original_filename).stem.strip()
        return stem or "Untitled Document"
