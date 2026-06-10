"""List, retrieve, and delete knowledge documents."""

import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.enums import DocumentStatus
from app.models.knowledge_document import KnowledgeDocument


def get_document_or_404(
    db: Session,
    *,
    document_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> KnowledgeDocument:
    """Load one document within the given organization or raise 404."""
    document = db.scalar(
        select(KnowledgeDocument).where(
            KnowledgeDocument.id == document_id,
            KnowledgeDocument.organization_id == organization_id,
        )
    )
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return document


def list_documents(
    db: Session,
    *,
    organization_id: uuid.UUID,
    status: DocumentStatus | None = None,
) -> list[KnowledgeDocument]:
    """List documents for one organization, optionally filtered by status."""
    query = select(KnowledgeDocument).where(KnowledgeDocument.organization_id == organization_id)
    if status is not None:
        query = query.where(KnowledgeDocument.status == status)

    return list(
        db.scalars(query.order_by(KnowledgeDocument.created_at.desc())).all()
    )


def delete_document(
    db: Session,
    settings: Settings,
    document: KnowledgeDocument,
) -> None:
    """Delete a document's files, database record, and related chunks."""
    document_dir = Path(settings.upload_dir) / str(document.organization_id) / str(document.id)
    shutil.rmtree(document_dir, ignore_errors=True)

    db.delete(document)
    db.commit()
