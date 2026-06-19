"""Create and manage support tickets and conversation messages."""

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.text import slugify
from app.models.enums import (
    AIEmployeeStatus,
    SupportMessageRole,
    SupportTicketPriority,
    SupportTicketStatus,
)
from app.models.ai_employee import AIEmployee
from app.models.support_ticket import SupportTicket
from app.models.support_ticket_message import SupportTicketMessage
from app.models.user import User
from app.schemas.support_ticket import (
    SupportAiSuggestionResponse,
    SupportMessageCreateRequest,
    SupportMessageResponse,
    SupportTicketCreateRequest,
    SupportTicketDetailResponse,
    SupportTicketUpdateRequest,
)
from app.services.ai_employee_service import get_employee_or_404, list_knowledge_assignments
from app.services.chroma_service import ChromaService
from app.services.employee_rag_service import EmployeeRAGService, citations_to_json
from app.services.embedding_service import EmbeddingService
from app.services.support_ai_recommendation import build_support_recommendation
from app.services.support_category_service import get_support_category_or_404

_RESOLUTION_ROLES = {
    SupportMessageRole.AGENT,
    SupportMessageRole.AI_ASSISTANT,
}
_REOPEN_TARGET_STATUSES = {
    SupportTicketStatus.OPEN,
    SupportTicketStatus.IN_PROGRESS,
    SupportTicketStatus.WAITING,
}
_TERMINAL_STATUSES = {
    SupportTicketStatus.RESOLVED,
    SupportTicketStatus.CLOSED,
}


def _is_resolution_role(role: SupportMessageRole) -> bool:
    return role in _RESOLUTION_ROLES


def _get_latest_resolution_message(
    db: Session,
    *,
    ticket_id: uuid.UUID,
    after: datetime | None = None,
) -> SupportTicketMessage | None:
    query = (
        select(SupportTicketMessage)
        .where(
            SupportTicketMessage.ticket_id == ticket_id,
            SupportTicketMessage.is_internal.is_(False),
            SupportTicketMessage.role.in_(_RESOLUTION_ROLES),
        )
        .order_by(SupportTicketMessage.created_at.desc())
        .limit(1)
    )
    if after is not None:
        query = query.where(SupportTicketMessage.created_at > after)

    return db.scalar(query)


def _ticket_has_resolution(
    db: Session,
    *,
    ticket: SupportTicket,
    pending_message: SupportTicketMessage | None = None,
) -> bool:
    if pending_message is not None:
        if (
            not pending_message.is_internal
            and _is_resolution_role(pending_message.role)
        ):
            if ticket.reopened_at is None:
                return True
            if pending_message.created_at > ticket.reopened_at:
                return True

    return _get_latest_resolution_message(
        db,
        ticket_id=ticket.id,
        after=ticket.reopened_at,
    ) is not None


def _ensure_ticket_can_be_resolved(
    db: Session,
    *,
    ticket: SupportTicket,
    pending_message: SupportTicketMessage | None = None,
) -> SupportTicketMessage:
    resolution_message = pending_message
    if resolution_message is None:
        resolution_message = _get_latest_resolution_message(
            db,
            ticket_id=ticket.id,
            after=ticket.reopened_at,
        )

    if resolution_message is None or not _ticket_has_resolution(
        db,
        ticket=ticket,
        pending_message=pending_message,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Ticket cannot be resolved without a public agent or AI employee reply. "
                "Send a resolution message first, or use Send & resolve."
            ),
        )

    return resolution_message


def _apply_resolved_state(
    ticket: SupportTicket,
    *,
    resolution_message: SupportTicketMessage,
) -> None:
    ticket.status = SupportTicketStatus.RESOLVED
    ticket.resolved_at = resolution_message.created_at
    ticket.resolved_message_id = resolution_message.id
    ticket.reopened_at = None


def _mark_ticket_reopened(ticket: SupportTicket) -> None:
    ticket.reopened_at = datetime.now(UTC)
    ticket.resolved_at = None
    ticket.resolved_message_id = None


def _resolve_slug(subject: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(subject)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket slug must contain at least one letter or number",
        )
    return resolved[:50]


def _ensure_unique_slug(
    db: Session,
    *,
    organization_id: uuid.UUID,
    slug: str,
    exclude_ticket_id: uuid.UUID | None = None,
) -> None:
    query = select(SupportTicket.id).where(
        SupportTicket.organization_id == organization_id,
        SupportTicket.slug == slug,
    )
    if exclude_ticket_id is not None:
        query = query.where(SupportTicket.id != exclude_ticket_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ticket slug '{slug}' is already taken in this organization",
        )


def _ensure_user_in_org(
    db: Session,
    *,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> User:
    user = db.scalar(
        select(User).where(
            User.id == user_id,
            User.organization_id == organization_id,
            User.is_active.is_(True),
        )
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned user not found in this organization",
        )
    return user


def _validate_status_transition(
    current: SupportTicketStatus,
    new: SupportTicketStatus,
) -> None:
    if current == new:
        return

    allowed: dict[SupportTicketStatus, set[SupportTicketStatus]] = {
        SupportTicketStatus.OPEN: {
            SupportTicketStatus.IN_PROGRESS,
            SupportTicketStatus.WAITING,
            SupportTicketStatus.RESOLVED,
            SupportTicketStatus.CLOSED,
        },
        SupportTicketStatus.IN_PROGRESS: {
            SupportTicketStatus.WAITING,
            SupportTicketStatus.RESOLVED,
            SupportTicketStatus.CLOSED,
            SupportTicketStatus.OPEN,
        },
        SupportTicketStatus.WAITING: {
            SupportTicketStatus.IN_PROGRESS,
            SupportTicketStatus.RESOLVED,
            SupportTicketStatus.CLOSED,
            SupportTicketStatus.OPEN,
        },
        SupportTicketStatus.RESOLVED: {
            SupportTicketStatus.CLOSED,
            SupportTicketStatus.OPEN,
            SupportTicketStatus.IN_PROGRESS,
        },
        SupportTicketStatus.CLOSED: {
            SupportTicketStatus.OPEN,
            SupportTicketStatus.IN_PROGRESS,
        },
    }

    if new not in allowed.get(current, set()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition ticket from '{current.value}' to '{new.value}'",
        )


def get_support_ticket_or_404(
    db: Session,
    *,
    ticket_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> SupportTicket:
    ticket = db.scalar(
        select(SupportTicket)
        .where(
            SupportTicket.id == ticket_id,
            SupportTicket.organization_id == organization_id,
        )
        .options(
            selectinload(SupportTicket.category),
            selectinload(SupportTicket.assigned_user),
            selectinload(SupportTicket.assigned_ai_employee),
        )
    )
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support ticket not found",
        )
    return ticket


def _format_user_name(user: User | None) -> str | None:
    if user is None:
        return None
    return f"{user.first_name} {user.last_name}".strip()


def build_ticket_detail_response(
    db: Session,
    *,
    ticket: SupportTicket,
) -> SupportTicketDetailResponse:
    message_count = db.scalar(
        select(func.count())
        .select_from(SupportTicketMessage)
        .where(SupportTicketMessage.ticket_id == ticket.id)
    ) or 0

    return SupportTicketDetailResponse(
        id=ticket.id,
        organization_id=ticket.organization_id,
        category_id=ticket.category_id,
        created_by_id=ticket.created_by_id,
        assigned_user_id=ticket.assigned_user_id,
        assigned_ai_employee_id=ticket.assigned_ai_employee_id,
        subject=ticket.subject,
        slug=ticket.slug,
        description=ticket.description,
        customer_name=ticket.customer_name,
        customer_email=ticket.customer_email,
        status=ticket.status,
        priority=ticket.priority,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        resolved_at=ticket.resolved_at,
        resolved_message_id=ticket.resolved_message_id,
        has_resolution=_ticket_has_resolution(db, ticket=ticket),
        category_name=ticket.category.name if ticket.category else None,
        assigned_user_name=_format_user_name(ticket.assigned_user),
        assigned_ai_employee_name=(
            ticket.assigned_ai_employee.name if ticket.assigned_ai_employee else None
        ),
        message_count=message_count,
    )


def list_support_tickets(
    db: Session,
    *,
    organization_id: uuid.UUID,
    status: SupportTicketStatus | None = None,
    category_id: uuid.UUID | None = None,
    priority: SupportTicketPriority | None = None,
    assigned_user_id: uuid.UUID | None = None,
    assigned_ai_employee_id: uuid.UUID | None = None,
    unassigned_only: bool = False,
) -> list[SupportTicket]:
    query = select(SupportTicket).where(SupportTicket.organization_id == organization_id)

    if status is not None:
        query = query.where(SupportTicket.status == status)
    if category_id is not None:
        query = query.where(SupportTicket.category_id == category_id)
    if priority is not None:
        query = query.where(SupportTicket.priority == priority)
    if assigned_user_id is not None:
        query = query.where(SupportTicket.assigned_user_id == assigned_user_id)
    if assigned_ai_employee_id is not None:
        query = query.where(SupportTicket.assigned_ai_employee_id == assigned_ai_employee_id)
    if unassigned_only:
        query = query.where(
            SupportTicket.assigned_user_id.is_(None),
            SupportTicket.assigned_ai_employee_id.is_(None),
        )

    return list(db.scalars(query.order_by(SupportTicket.updated_at.desc())).all())


def create_support_ticket(
    db: Session,
    *,
    organization_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: SupportTicketCreateRequest,
) -> SupportTicket:
    if payload.category_id is not None:
        get_support_category_or_404(
            db,
            category_id=payload.category_id,
            organization_id=organization_id,
        )

    if payload.assigned_user_id is not None:
        _ensure_user_in_org(
            db,
            user_id=payload.assigned_user_id,
            organization_id=organization_id,
        )

    if payload.assigned_ai_employee_id is not None:
        employee = get_employee_or_404(
            db,
            employee_id=payload.assigned_ai_employee_id,
            organization_id=organization_id,
        )
        if employee.status != AIEmployeeStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned AI employee must be active",
            )

    slug = _resolve_slug(payload.subject, payload.slug)
    _ensure_unique_slug(db, organization_id=organization_id, slug=slug)

    ticket = SupportTicket(
        organization_id=organization_id,
        created_by_id=created_by_id,
        category_id=payload.category_id,
        subject=payload.subject,
        slug=slug,
        description=payload.description,
        customer_name=payload.customer_name,
        customer_email=str(payload.customer_email) if payload.customer_email else None,
        priority=payload.priority,
        assigned_user_id=payload.assigned_user_id,
        assigned_ai_employee_id=payload.assigned_ai_employee_id,
        status=SupportTicketStatus.OPEN,
    )
    db.add(ticket)
    db.flush()

    if payload.initial_message:
        db.add(
            SupportTicketMessage(
                ticket_id=ticket.id,
                author_user_id=created_by_id,
                role=SupportMessageRole.AGENT,
                content=payload.initial_message,
            )
        )
    elif payload.description:
        db.add(
            SupportTicketMessage(
                ticket_id=ticket.id,
                author_user_id=created_by_id,
                role=SupportMessageRole.SYSTEM,
                content=f"Ticket created: {payload.description}",
            )
        )

    db.commit()
    db.refresh(ticket)
    return ticket


def update_support_ticket(
    db: Session,
    *,
    ticket: SupportTicket,
    payload: SupportTicketUpdateRequest,
) -> SupportTicket:
    if payload.category_id is not None:
        get_support_category_or_404(
            db,
            category_id=payload.category_id,
            organization_id=ticket.organization_id,
        )
        ticket.category_id = payload.category_id

    if payload.assigned_user_id is not None:
        _ensure_user_in_org(
            db,
            user_id=payload.assigned_user_id,
            organization_id=ticket.organization_id,
        )
        ticket.assigned_user_id = payload.assigned_user_id

    if payload.assigned_ai_employee_id is not None:
        employee = get_employee_or_404(
            db,
            employee_id=payload.assigned_ai_employee_id,
            organization_id=ticket.organization_id,
        )
        if employee.status != AIEmployeeStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned AI employee must be active",
            )
        ticket.assigned_ai_employee_id = payload.assigned_ai_employee_id

    if payload.subject is not None:
        ticket.subject = payload.subject
    if payload.slug is not None or payload.subject is not None:
        slug = _resolve_slug(payload.subject or ticket.subject, payload.slug or ticket.slug)
        _ensure_unique_slug(
            db,
            organization_id=ticket.organization_id,
            slug=slug,
            exclude_ticket_id=ticket.id,
        )
        ticket.slug = slug
    if payload.description is not None:
        ticket.description = payload.description
    if payload.customer_name is not None:
        ticket.customer_name = payload.customer_name
    if payload.customer_email is not None:
        ticket.customer_email = str(payload.customer_email)
    if payload.priority is not None:
        ticket.priority = payload.priority
    if payload.status is not None:
        new_status = payload.status
        current_status = ticket.status
        _validate_status_transition(current_status, new_status)

        if new_status == SupportTicketStatus.RESOLVED:
            resolution_message = _ensure_ticket_can_be_resolved(db, ticket=ticket)
            _apply_resolved_state(ticket, resolution_message=resolution_message)
        else:
            if (
                current_status in _TERMINAL_STATUSES
                and new_status in _REOPEN_TARGET_STATUSES
            ):
                _mark_ticket_reopened(ticket)
            ticket.status = new_status

    db.commit()
    db.refresh(ticket)
    return ticket


def delete_support_ticket(
    db: Session,
    *,
    ticket: SupportTicket,
) -> None:
    db.delete(ticket)
    db.commit()


def list_ticket_messages(
    db: Session,
    *,
    ticket_id: uuid.UUID,
    organization_id: uuid.UUID,
    include_internal: bool = True,
) -> list[SupportMessageResponse]:
    get_support_ticket_or_404(db, ticket_id=ticket_id, organization_id=organization_id)

    query = (
        select(SupportTicketMessage)
        .join(SupportTicket, SupportTicketMessage.ticket_id == SupportTicket.id)
        .where(
            SupportTicketMessage.ticket_id == ticket_id,
            SupportTicket.organization_id == organization_id,
        )
        .options(
            selectinload(SupportTicketMessage.author_user),
            selectinload(SupportTicketMessage.author_ai_employee),
        )
        .order_by(SupportTicketMessage.created_at)
    )

    if not include_internal:
        query = query.where(SupportTicketMessage.is_internal.is_(False))

    messages = list(db.scalars(query).all())
    return [_build_message_response(message) for message in messages]


def _build_message_response(message: SupportTicketMessage) -> SupportMessageResponse:
    return SupportMessageResponse(
        id=message.id,
        ticket_id=message.ticket_id,
        author_user_id=message.author_user_id,
        author_ai_employee_id=message.author_ai_employee_id,
        role=message.role,
        content=message.content,
        is_internal=message.is_internal,
        created_at=message.created_at,
        updated_at=message.updated_at,
        author_user_name=_format_user_name(message.author_user),
        author_ai_employee_name=(
            message.author_ai_employee.name if message.author_ai_employee else None
        ),
    )


def create_ticket_message(
    db: Session,
    *,
    ticket: SupportTicket,
    author_user_id: uuid.UUID,
    payload: SupportMessageCreateRequest,
) -> SupportMessageResponse:
    if payload.resolve_ticket and payload.is_internal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot resolve a ticket with an internal note",
        )

    role = payload.role
    author_ai_employee_id: uuid.UUID | None = None

    if payload.as_ai_employee and not payload.is_internal:
        if ticket.assigned_ai_employee_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ticket must have an assigned AI employee to send as AI assistant",
            )
        role = SupportMessageRole.AI_ASSISTANT
        author_ai_employee_id = ticket.assigned_ai_employee_id
    elif role == SupportMessageRole.AI_ASSISTANT:
        if ticket.assigned_ai_employee_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ticket must have an assigned AI employee for AI assistant messages",
            )
        author_ai_employee_id = ticket.assigned_ai_employee_id

    message = SupportTicketMessage(
        ticket_id=ticket.id,
        author_user_id=author_user_id if role != SupportMessageRole.AI_ASSISTANT else None,
        author_ai_employee_id=author_ai_employee_id,
        role=role,
        content=payload.content,
        is_internal=payload.is_internal,
    )
    db.add(message)
    db.flush()
    db.refresh(message)

    if not payload.is_internal and role in _RESOLUTION_ROLES:
        if ticket.status == SupportTicketStatus.OPEN:
            ticket.status = SupportTicketStatus.IN_PROGRESS

    if payload.resolve_ticket:
        resolution_message = _ensure_ticket_can_be_resolved(
            db,
            ticket=ticket,
            pending_message=message,
        )
        _validate_status_transition(ticket.status, SupportTicketStatus.RESOLVED)
        _apply_resolved_state(ticket, resolution_message=resolution_message)

    db.commit()
    db.refresh(message)

    message = db.scalar(
        select(SupportTicketMessage)
        .where(SupportTicketMessage.id == message.id)
        .options(
            selectinload(SupportTicketMessage.author_user),
            selectinload(SupportTicketMessage.author_ai_employee),
        )
    )
    assert message is not None
    return _build_message_response(message)


def suggest_ai_response(
    db: Session,
    *,
    ticket: SupportTicket,
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
    employee_rag_service: EmployeeRAGService,
) -> SupportAiSuggestionResponse:
    """Generate an AI-assisted reply suggestion without persisting it."""
    if ticket.assigned_ai_employee_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket must have an assigned AI employee to generate a response",
        )

    employee = get_employee_or_404(
        db,
        employee_id=ticket.assigned_ai_employee_id,
        organization_id=ticket.organization_id,
    )

    messages = list(
        db.scalars(
            select(SupportTicketMessage)
            .where(
                SupportTicketMessage.ticket_id == ticket.id,
                SupportTicketMessage.is_internal.is_(False),
            )
            .order_by(SupportTicketMessage.created_at.asc())
        ).all()
    )

    if messages:
        latest_customer = next(
            (
                message.content
                for message in reversed(messages)
                if message.role == SupportMessageRole.CUSTOMER
            ),
            messages[-1].content,
        )
        history = [
            (message.role.value, message.content)
            for message in messages[-10:]
            if message.role
            in {
                SupportMessageRole.CUSTOMER,
                SupportMessageRole.AGENT,
                SupportMessageRole.AI_ASSISTANT,
            }
        ]
        question = latest_customer
    else:
        question = ticket.description or ticket.subject
        history = []

    ticket_context = {
        "subject": ticket.subject,
        "description": ticket.description,
        "customer_name": ticket.customer_name,
        "customer_email": ticket.customer_email,
    }

    answer, sources = _generate_support_ai_response(
        db=db,
        employee=employee,
        question=question,
        conversation_history=history,
        ticket_context=ticket_context,
        embedding_service=embedding_service,
        chroma_service=chroma_service,
        employee_rag_service=employee_rag_service,
    )

    recommendation = build_support_recommendation(answer=answer, sources=sources)

    return SupportAiSuggestionResponse(
        suggestion=answer,
        sources=citations_to_json(sources) or [],
        confidence=recommendation.confidence,
        recommended_status=recommendation.recommended_status,
        reasoning=recommendation.reasoning,
        can_auto_resolve=recommendation.can_auto_resolve,
    )


def _generate_support_ai_response(
    db: Session,
    *,
    employee: AIEmployee,
    question: str,
    conversation_history: list[tuple[str, str]],
    ticket_context: dict[str, Any],
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
    employee_rag_service: EmployeeRAGService,
) -> tuple[str, list[Any]]:
    context_note = f"\nTicket context: {ticket_context}"

    assignments = list_knowledge_assignments(db, employee=employee)
    if assignments:
        document_ids = [assignment.knowledge_document_id for assignment in assignments]
        answer, sources = employee_rag_service.answer_for_employee(
            organization_id=employee.organization_id,
            system_prompt=(
                f"{employee.system_prompt.strip()}{context_note}\n\n"
                "You are assisting in a customer support ticket conversation. "
                "Be concise, helpful, and professional."
            ),
            question=question,
            document_ids=document_ids,
            embedding_service=embedding_service,
            chroma_service=chroma_service,
            conversation_history=conversation_history,
        )
        return answer, sources

    prompt = (
        f"{employee.system_prompt.strip()}{context_note}\n\n"
        "You are assisting in a customer support ticket conversation. "
        "Be concise, helpful, and professional."
    )
    answer = employee_rag_service._rag_service._generate_answer(
        question=question,
        context="No knowledge base documents are assigned to this employee.",
        system_prompt=prompt,
    )
    return answer, []
