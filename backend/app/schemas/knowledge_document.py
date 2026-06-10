"""Pydantic schemas for knowledge document request/response bodies."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import DocumentStatus
from app.schemas.validators import (
    StrippedKnowledgeDocumentTitle,
    StrippedOptionalDocumentType,
    StrippedOptionalKnowledgeDocumentTitle,
)


class KnowledgeDocumentCreateRequest(BaseModel):
    """Metadata supplied when uploading a document (file sent separately)."""

    title: StrippedOptionalKnowledgeDocumentTitle = None
    document_type: StrippedOptionalDocumentType = None


class KnowledgeDocumentUpdateRequest(BaseModel):
    title: StrippedOptionalKnowledgeDocumentTitle = None
    document_type: StrippedOptionalDocumentType = None


class KnowledgeDocumentResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    uploaded_by_id: uuid.UUID | None
    title: str
    original_filename: str
    file_path: str
    file_size_bytes: int = Field(ge=0)
    mime_type: str
    document_type: str | None
    status: DocumentStatus
    page_count: int | None = Field(default=None, ge=0)
    chunk_count: int = Field(ge=0)
    error_message: str | None
    processed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentChunkResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    organization_id: uuid.UUID
    chunk_index: int = Field(ge=0)
    content: str
    page_number: int | None = Field(default=None, ge=1)
    token_count: int | None = Field(default=None, ge=0)
    chroma_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
