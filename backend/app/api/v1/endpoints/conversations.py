"""AI employee conversation read endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.authorization import require_permission
from app.core.permissions import EMPLOYEES_CHAT
from app.db.session import get_db
from app.models.ai_employee_conversation import AIEmployeeConversation
from app.models.user import User
from app.schemas.ai_employee_chat import AIEmployeeConversationDetailResponse
from app.services.employee_chat_service import get_conversation_or_404

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("/{conversation_id}", response_model=AIEmployeeConversationDetailResponse)
def get_conversation(
    conversation_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_CHAT))],
    db: Annotated[Session, Depends(get_db)],
) -> AIEmployeeConversation:
    """Get one conversation with full message history for the current user."""
    return get_conversation_or_404(
        db,
        conversation_id=conversation_id,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
    )
