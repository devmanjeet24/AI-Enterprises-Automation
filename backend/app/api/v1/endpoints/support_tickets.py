"""Customer support ticket and message endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.authorization import require_permission
from app.core.permissions import (
    SUPPORT_TICKETS_DELETE,
    SUPPORT_TICKETS_EXECUTE,
    SUPPORT_TICKETS_READ,
    SUPPORT_TICKETS_WRITE,
)
from app.models.enums import SupportTicketPriority, SupportTicketStatus
from app.models.user import User
from app.schemas.support_ticket import (
    SupportAnalyticsResponse,
    SupportMessageCreateRequest,
    SupportMessageResponse,
    SupportTicketCreateRequest,
    SupportTicketDetailResponse,
    SupportTicketResponse,
    SupportTicketUpdateRequest,
)
from app.services.support_analytics_service import get_support_analytics
from app.services.support_ticket_service import (
    build_ticket_detail_response,
    create_support_ticket,
    create_ticket_message,
    delete_support_ticket,
    get_support_ticket_or_404,
    list_support_tickets,
    list_ticket_messages,
    update_support_ticket,
)

router = APIRouter(prefix="/support-tickets", tags=["support-tickets"])


@router.get("/analytics", response_model=SupportAnalyticsResponse)
def get_support_analytics_endpoint(
    current_user: Annotated[User, Depends(require_permission(SUPPORT_TICKETS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> SupportAnalyticsResponse:
    """Aggregate support ticket metrics for the organization."""
    return get_support_analytics(db, organization_id=current_user.organization_id)


@router.post("", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
def create_support_ticket_endpoint(
    payload: SupportTicketCreateRequest,
    current_user: Annotated[User, Depends(require_permission(SUPPORT_TICKETS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> SupportTicketResponse:
    """Create a support ticket."""
    return create_support_ticket(
        db,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=list[SupportTicketResponse])
def list_support_tickets_endpoint(
    current_user: Annotated[User, Depends(require_permission(SUPPORT_TICKETS_READ))],
    db: Annotated[Session, Depends(get_db)],
    status: Annotated[SupportTicketStatus | None, Query()] = None,
    category_id: Annotated[uuid.UUID | None, Query()] = None,
    priority: Annotated[SupportTicketPriority | None, Query()] = None,
    assigned_user_id: Annotated[uuid.UUID | None, Query()] = None,
    assigned_ai_employee_id: Annotated[uuid.UUID | None, Query()] = None,
    unassigned_only: Annotated[bool, Query()] = False,
) -> list[SupportTicketResponse]:
    """List support tickets in the current organization."""
    return list_support_tickets(
        db,
        organization_id=current_user.organization_id,
        status=status,
        category_id=category_id,
        priority=priority,
        assigned_user_id=assigned_user_id,
        assigned_ai_employee_id=assigned_ai_employee_id,
        unassigned_only=unassigned_only,
    )


@router.get("/{ticket_id}", response_model=SupportTicketDetailResponse)
def get_support_ticket_endpoint(
    ticket_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(SUPPORT_TICKETS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> SupportTicketDetailResponse:
    """Get one support ticket with assignment details."""
    ticket = get_support_ticket_or_404(
        db,
        ticket_id=ticket_id,
        organization_id=current_user.organization_id,
    )
    return build_ticket_detail_response(db, ticket=ticket)


@router.patch("/{ticket_id}", response_model=SupportTicketResponse)
def update_support_ticket_endpoint(
    ticket_id: uuid.UUID,
    payload: SupportTicketUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(SUPPORT_TICKETS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> SupportTicketResponse:
    """Update a support ticket including status, category, and assignments."""
    ticket = get_support_ticket_or_404(
        db,
        ticket_id=ticket_id,
        organization_id=current_user.organization_id,
    )
    return update_support_ticket(db, ticket=ticket, payload=payload)


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_support_ticket_endpoint(
    ticket_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(SUPPORT_TICKETS_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a support ticket."""
    ticket = get_support_ticket_or_404(
        db,
        ticket_id=ticket_id,
        organization_id=current_user.organization_id,
    )
    delete_support_ticket(db, ticket=ticket)


@router.get("/{ticket_id}/messages", response_model=list[SupportMessageResponse])
def list_ticket_messages_endpoint(
    ticket_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(SUPPORT_TICKETS_READ))],
    db: Annotated[Session, Depends(get_db)],
    include_internal: Annotated[bool, Query()] = True,
) -> list[SupportMessageResponse]:
    """List conversation messages for a support ticket."""
    return list_ticket_messages(
        db,
        ticket_id=ticket_id,
        organization_id=current_user.organization_id,
        include_internal=include_internal,
    )


@router.post(
    "/{ticket_id}/messages",
    response_model=SupportMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ticket_message_endpoint(
    ticket_id: uuid.UUID,
    payload: SupportMessageCreateRequest,
    current_user: Annotated[User, Depends(require_permission(SUPPORT_TICKETS_EXECUTE))],
    db: Annotated[Session, Depends(get_db)],
) -> SupportMessageResponse:
    """Add a message to a support ticket conversation thread."""
    ticket = get_support_ticket_or_404(
        db,
        ticket_id=ticket_id,
        organization_id=current_user.organization_id,
    )
    return create_ticket_message(
        db,
        ticket=ticket,
        author_user_id=current_user.id,
        payload=payload,
    )
