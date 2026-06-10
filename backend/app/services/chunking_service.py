"""Split extracted PDF text into DocumentChunk records."""

import uuid
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException, status
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.document_chunk import DocumentChunk
from app.models.enums import DocumentStatus
from app.models.knowledge_document import KnowledgeDocument
from app.services.document_processor import DocumentProcessingError, PdfPageText, extract_pdf_text

# Tuned for handbooks, policies, SOPs, and internal docs (~150-200 tokens per chunk).
CHUNK_SIZE = 800
CHUNK_OVERLAP = 150


@dataclass(frozen=True)
class ChunkDraft:
    """In-memory chunk before it is saved to PostgreSQL."""

    chunk_index: int
    content: str
    page_number: int
    token_count: int


class ChunkingService:
    """Split page-level PDF text into overlapping chunks."""

    def __init__(
        self,
        *,
        chunk_size: int = CHUNK_SIZE,
        chunk_overlap: int = CHUNK_OVERLAP,
    ) -> None:
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def split_page_text(self, text: str) -> list[str]:
        """Split one page of text into chunk strings."""
        stripped = text.strip()
        if not stripped:
            return []
        return [chunk.strip() for chunk in self._splitter.split_text(stripped) if chunk.strip()]

    def build_chunk_drafts(self, pages: list[PdfPageText]) -> list[ChunkDraft]:
        """Create ordered chunk drafts from page-level extracted text."""
        drafts: list[ChunkDraft] = []
        chunk_index = 0

        for page in pages:
            for content in self.split_page_text(page.text):
                drafts.append(
                    ChunkDraft(
                        chunk_index=chunk_index,
                        content=content,
                        page_number=page.page_number,
                        token_count=approximate_token_count(content),
                    )
                )
                chunk_index += 1

        return drafts


def approximate_token_count(text: str) -> int:
    """Estimate token count using a simple characters-per-token heuristic."""
    return max(1, len(text) // 4)


def _validate_document_ready_for_chunking(document: KnowledgeDocument) -> None:
    if document.status == DocumentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document must be processed before chunking",
        )
    if document.status == DocumentStatus.PROCESSING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document is still being processed",
        )
    if document.status == DocumentStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document processing failed; re-run processing before chunking",
        )
    if document.status != DocumentStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document is not ready for chunking",
        )


def chunk_document(
    db: Session,
    settings: Settings,
    document: KnowledgeDocument,
    chunking_service: ChunkingService | None = None,
) -> KnowledgeDocument:
    """Re-extract a processed PDF, chunk its text, and persist DocumentChunk rows."""
    _validate_document_ready_for_chunking(document)

    file_path = Path(settings.upload_dir) / document.file_path
    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF file not found on disk",
        )

    service = chunking_service or ChunkingService()

    try:
        extraction = extract_pdf_text(file_path)
    except DocumentProcessingError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    drafts = service.build_chunk_drafts(extraction.pages)
    if not drafts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No chunkable text found in PDF",
        )

    db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document.id))

    for draft in drafts:
        db.add(
            DocumentChunk(
                id=uuid.uuid4(),
                document_id=document.id,
                organization_id=document.organization_id,
                chunk_index=draft.chunk_index,
                content=draft.content,
                page_number=draft.page_number,
                token_count=draft.token_count,
            )
        )

    document.chunk_count = len(drafts)
    db.commit()
    db.refresh(document)
    return document


def list_document_chunks(
    db: Session,
    *,
    document_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> list[DocumentChunk]:
    """Return chunks for one document in chunk order."""
    return list(
        db.scalars(
            select(DocumentChunk)
            .where(
                DocumentChunk.document_id == document_id,
                DocumentChunk.organization_id == organization_id,
            )
            .order_by(DocumentChunk.chunk_index)
        ).all()
    )
