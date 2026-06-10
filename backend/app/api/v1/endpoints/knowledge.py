"""Knowledge question answering endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.v1.endpoints.documents import get_chroma_service, get_embedding_service
from app.config import Settings, get_settings
from app.core.authorization import require_permission
from app.core.permissions import KNOWLEDGE_QUERY
from app.models.user import User
from app.schemas.knowledge_query import KnowledgeQueryRequest, KnowledgeQueryResponse
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService
from app.services.rag_service import RAGService

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


def get_rag_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> RAGService:
    return RAGService(settings)


@router.post("/query", response_model=KnowledgeQueryResponse)
def query_knowledge_base(
    payload: KnowledgeQueryRequest,
    current_user: Annotated[User, Depends(require_permission(KNOWLEDGE_QUERY))],
    settings: Annotated[Settings, Depends(get_settings)],
    embedding_service: Annotated[EmbeddingService, Depends(get_embedding_service)],
    chroma_service: Annotated[ChromaService, Depends(get_chroma_service)],
    rag_service: Annotated[RAGService, Depends(get_rag_service)],
) -> KnowledgeQueryResponse:
    """Ask a natural language question against the organization's embedded knowledge base."""
    return rag_service.answer_question(
        organization_id=current_user.organization_id,
        question=payload.question,
        embedding_service=embedding_service,
        chroma_service=chroma_service,
    )
