"""Knowledge document upload and management endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.core.authorization import require_permission
from app.core.permissions import DOCUMENTS_DELETE, DOCUMENTS_READ, DOCUMENTS_WRITE
from app.db.session import get_db
from app.models.enums import DocumentStatus
from app.models.knowledge_document import KnowledgeDocument
from app.models.user import User
from app.schemas.knowledge_document import KnowledgeDocumentResponse
from app.schemas.knowledge_search import DocumentSearchRequest, DocumentSearchResponse
from app.schemas.validators import (
    StrippedOptionalDocumentType,
    StrippedOptionalKnowledgeDocumentTitle,
)
from app.services.chunking_service import ChunkingService, chunk_document
from app.services.chroma_service import ChromaService
from app.services.document_processor import process_document
from app.services.document_service import (
    delete_document,
    get_document_or_404,
    list_documents,
)
from app.services.embedding_service import EmbeddingService
from app.services.retrieval_service import (
    embed_document,
    get_cached_embedding_service,
    search_documents,
)
from app.services.upload_service import UploadService

router = APIRouter(prefix="/documents", tags=["documents"])


def get_upload_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> UploadService:
    return UploadService(settings)


def get_chunking_service() -> ChunkingService:
    return ChunkingService()


def get_embedding_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> EmbeddingService:
    return get_cached_embedding_service(settings.embedding_model_name)


def get_chroma_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> ChromaService:
    return ChromaService(settings.chroma_persist_dir)


@router.post("", response_model=KnowledgeDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: Annotated[UploadFile, File(description="PDF file to upload")],
    current_user: Annotated[User, Depends(require_permission(DOCUMENTS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
    upload_service: Annotated[UploadService, Depends(get_upload_service)],
    title: Annotated[
        StrippedOptionalKnowledgeDocumentTitle,
        Form(description="Display title (defaults to the filename)"),
    ] = None,
    document_type: Annotated[
        StrippedOptionalDocumentType,
        Form(description="Optional category such as policy, handbook, or sop"),
    ] = None,
) -> KnowledgeDocument:
    """Upload a PDF knowledge document for the current organization."""
    return await upload_service.create_document_from_upload(
        db,
        file=file,
        organization_id=current_user.organization_id,
        uploaded_by_id=current_user.id,
        title=title,
        document_type=document_type,
    )


@router.get("", response_model=list[KnowledgeDocumentResponse])
def list_organization_documents(
    current_user: Annotated[User, Depends(require_permission(DOCUMENTS_READ))],
    db: Annotated[Session, Depends(get_db)],
    status: Annotated[
        DocumentStatus | None,
        Query(description="Filter by document status"),
    ] = None,
) -> list[KnowledgeDocument]:
    """List knowledge documents in the current organization."""
    return list_documents(
        db,
        organization_id=current_user.organization_id,
        status=status,
    )


@router.post("/search", response_model=DocumentSearchResponse)
def search_organization_documents(
    payload: DocumentSearchRequest,
    current_user: Annotated[User, Depends(require_permission(DOCUMENTS_READ))],
    settings: Annotated[Settings, Depends(get_settings)],
    embedding_service: Annotated[EmbeddingService, Depends(get_embedding_service)],
    chroma_service: Annotated[ChromaService, Depends(get_chroma_service)],
) -> DocumentSearchResponse:
    """Search embedded knowledge chunks semantically within the current organization."""
    return search_documents(
        organization_id=current_user.organization_id,
        query=payload.query,
        settings=settings,
        embedding_service=embedding_service,
        chroma_service=chroma_service,
        top_k=payload.top_k,
    )


@router.get("/{document_id}", response_model=KnowledgeDocumentResponse)
def get_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(DOCUMENTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> KnowledgeDocument:
    """Get one knowledge document by id within the current organization."""
    return get_document_or_404(
        db,
        document_id=document_id,
        organization_id=current_user.organization_id,
    )


@router.post("/{document_id}/process", response_model=KnowledgeDocumentResponse)
def process_organization_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(DOCUMENTS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> KnowledgeDocument:
    """Extract text from a PDF and update document processing metadata."""
    document = get_document_or_404(
        db,
        document_id=document_id,
        organization_id=current_user.organization_id,
    )
    return process_document(db, settings, document)


@router.post("/{document_id}/chunk", response_model=KnowledgeDocumentResponse)
def chunk_organization_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(DOCUMENTS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    chunking_service: Annotated[ChunkingService, Depends(get_chunking_service)],
) -> KnowledgeDocument:
    """Split a processed PDF into DocumentChunk records."""
    document = get_document_or_404(
        db,
        document_id=document_id,
        organization_id=current_user.organization_id,
    )
    return chunk_document(db, settings, document, chunking_service)


@router.post("/{document_id}/embed", response_model=KnowledgeDocumentResponse)
def embed_organization_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(DOCUMENTS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    embedding_service: Annotated[EmbeddingService, Depends(get_embedding_service)],
    chroma_service: Annotated[ChromaService, Depends(get_chroma_service)],
) -> KnowledgeDocument:
    """Generate embeddings for a chunked document and store them in ChromaDB."""
    document = get_document_or_404(
        db,
        document_id=document_id,
        organization_id=current_user.organization_id,
    )
    return embed_document(
        db,
        settings,
        document,
        embedding_service=embedding_service,
        chroma_service=chroma_service,
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(DOCUMENTS_DELETE))],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    """Delete a knowledge document, its files, and any related chunks."""
    document = get_document_or_404(
        db,
        document_id=document_id,
        organization_id=current_user.organization_id,
    )
    delete_document(db, settings, document)
