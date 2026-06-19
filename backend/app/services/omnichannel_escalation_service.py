"""Escalate omnichannel conversations to customer support tickets."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import OmnichannelAuditAction, SupportMessageRole, SupportTicketPriority
from app.models.omnichannel_conversation import OmnichannelConversation
from app.models.omnichannel_message import OmnichannelMessage
from app.models.support_ticket import SupportTicket
from app.schemas.support_ticket import SupportTicketCreateRequest
from app.services.omnichannel_audit_service import record_omnichannel_audit
from app.services.support_ticket_service import create_support_ticket


def escalate_conversation_to_ticket(
    db: Session,
    *,
    conversation: OmnichannelConversation,
    created_by_id: uuid.UUID,
) -> SupportTicket:
    if conversation.support_ticket_id is not None:
        existing = db.get(SupportTicket, conversation.support_ticket_id)
        if existing is not None:
            return existing

    latest_messages_rows = list(
        db.scalars(
            select(OmnichannelMessage)
            .where(OmnichannelMessage.conversation_id == conversation.id)
            .order_by(OmnichannelMessage.created_at.desc())
            .limit(5)
        ).all()
    )
    latest_messages = [
        f"[{message.role.value}] {message.content}" for message in reversed(latest_messages_rows)
    ]
    description = "\n".join(latest_messages) if latest_messages else None

    customer_email = None
    shared = conversation.shared_context or {}
    if isinstance(shared.get("email"), str):
        customer_email = shared["email"]

    ticket = create_support_ticket(
        db,
        organization_id=conversation.organization_id,
        created_by_id=created_by_id,
        payload=SupportTicketCreateRequest(
            subject=f"[Omnichannel] {conversation.subject}",
            customer_name=conversation.external_contact_name,
            customer_email=customer_email,
            priority=SupportTicketPriority.HIGH,
            assigned_user_id=conversation.assigned_user_id,
            assigned_ai_employee_id=conversation.assigned_ai_employee_id,
            description=description,
            initial_message=f"Escalated from omnichannel conversation {conversation.slug}",
        ),
    )

    conversation.support_ticket_id = ticket.id
    record_omnichannel_audit(
        db,
        organization_id=conversation.organization_id,
        conversation_id=conversation.id,
        channel_id=conversation.channel_id,
        actor_user_id=created_by_id,
        action=OmnichannelAuditAction.TICKET_ESCALATED,
        details={"support_ticket_id": str(ticket.id)},
    )
    db.commit()
    db.refresh(conversation)
    return ticket
