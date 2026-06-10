"""Pydantic schemas for semantic document search."""

import uuid

from pydantic import BaseModel, Field

from app.schemas.validators import StrippedKnowledgeQuery


class DocumentSearchRequest(BaseModel):
    query: StrippedKnowledgeQuery
    top_k: int | None = Field(
        default=None,
        ge=1,
        le=20,
        description="Maximum number of matching chunks to return",
    )


class DocumentSearchResult(BaseModel):
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    document_title: str
    chunk_index: int = Field(ge=0)
    page_number: int | None = Field(default=None, ge=1)
    content: str
    similarity_score: float = Field(ge=0.0, le=1.0)


class DocumentSearchResponse(BaseModel):
    query: str
    results: list[DocumentSearchResult]
