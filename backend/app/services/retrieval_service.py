"""Embed document chunks and run semantic search."""

import uuid
from datetime import UTC, datetime
from functools import lru_cache

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.enums import DocumentStatus
from app.models.knowledge_document import KnowledgeDocument
from app.schemas.knowledge_search import DocumentSearchResponse, DocumentSearchResult
from app.services.chunking_service import list_document_chunks
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService


def _validate_document_ready_for_embedding(document: KnowledgeDocument) -> None:
    if document.status != DocumentStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document must be processed successfully before embedding",
        )
    if document.chunk_count <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document must be chunked before embedding",
        )


def embed_document(
    db: Session,
    settings: Settings,
    document: KnowledgeDocument,
    *,
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
) -> KnowledgeDocument:
    """Generate embeddings for a document's chunks and store them in ChromaDB."""
    _validate_document_ready_for_embedding(document)

    chunks = list_document_chunks(
        db,
        document_id=document.id,
        organization_id=document.organization_id,
    )
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No chunks found for this document",
        )

    chroma_service.delete_vectors_for_document(document.organization_id, document.id)

    embeddings = embedding_service.embed_documents([chunk.content for chunk in chunks])
    chroma_service.upsert_document_chunks(
        organization_id=document.organization_id,
        document=document,
        chunks=chunks,
        embeddings=embeddings,
    )

    for chunk in chunks:
        chunk.chroma_id = str(chunk.id)

    document.embedded_at = datetime.now(UTC)
    db.commit()
    db.refresh(document)
    return document


def search_documents(
    *,
    organization_id: uuid.UUID,
    query: str,
    settings: Settings,
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
    top_k: int | None = None,
    document_ids: list[uuid.UUID] | None = None,
) -> DocumentSearchResponse:
    """Search embedded chunks semantically within one organization."""
    limit = top_k or settings.retrieval_top_k
    query_embedding = embedding_service.embed_query(query)
    hits = chroma_service.search(
        organization_id=organization_id,
        query_embedding=query_embedding,
        top_k=limit,
        document_ids=document_ids,
    )

    results = [
        DocumentSearchResult(
            chunk_id=uuid.UUID(hit.chunk_id),
            document_id=uuid.UUID(hit.document_id),
            document_title=hit.document_title,
            chunk_index=hit.chunk_index,
            page_number=hit.page_number if hit.page_number else None,
            content=hit.content,
            similarity_score=hit.similarity_score,
        )
        for hit in hits
    ]
    return DocumentSearchResponse(query=query, results=results)


@lru_cache
def get_cached_embedding_service(model_name: str) -> EmbeddingService:
    """Load and cache the embedding model for reuse across requests."""
    return EmbeddingService(model_name)
