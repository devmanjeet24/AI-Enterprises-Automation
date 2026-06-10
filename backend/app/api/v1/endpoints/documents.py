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
from app.schemas.validators import (
    StrippedOptionalDocumentType,
    StrippedOptionalKnowledgeDocumentTitle,
)
from app.services.document_service import (
    delete_document,
    get_document_or_404,
    list_documents,
)
from app.services.upload_service import UploadService

router = APIRouter(prefix="/documents", tags=["documents"])


def get_upload_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> UploadService:
    return UploadService(settings)


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
