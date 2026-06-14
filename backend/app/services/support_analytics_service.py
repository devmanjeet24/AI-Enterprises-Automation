"""Support ticket analytics aggregation."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import SupportTicketStatus
from app.models.support_ticket import SupportTicket
from app.models.support_ticket_category import SupportTicketCategory
from app.models.support_ticket_message import SupportTicketMessage


def get_support_analytics(
    db: Session,
    *,
    organization_id: uuid.UUID,
) -> dict:
    """Aggregate support ticket metrics for the organization."""
    status_rows = db.execute(
        select(SupportTicket.status, func.count())
        .where(SupportTicket.organization_id == organization_id)
        .group_by(SupportTicket.status)
    ).all()
    tickets_by_status = {status.value: count for status, count in status_rows}

    priority_rows = db.execute(
        select(SupportTicket.priority, func.count())
        .where(SupportTicket.organization_id == organization_id)
        .group_by(SupportTicket.priority)
    ).all()
    tickets_by_priority = {priority.value: count for priority, count in priority_rows}

    category_rows = db.execute(
        select(SupportTicketCategory.name, func.count())
        .join(SupportTicket, SupportTicket.category_id == SupportTicketCategory.id)
        .where(SupportTicket.organization_id == organization_id)
        .group_by(SupportTicketCategory.name)
    ).all()
    tickets_by_category = {name: count for name, count in category_rows}

    uncategorized_count = db.scalar(
        select(func.count())
        .select_from(SupportTicket)
        .where(
            SupportTicket.organization_id == organization_id,
            SupportTicket.category_id.is_(None),
        )
    ) or 0
    if uncategorized_count:
        tickets_by_category["Uncategorized"] = uncategorized_count

    total_tickets = sum(tickets_by_status.values())

    total_messages = db.scalar(
        select(func.count())
        .select_from(SupportTicketMessage)
        .join(SupportTicket, SupportTicketMessage.ticket_id == SupportTicket.id)
        .where(SupportTicket.organization_id == organization_id)
    ) or 0

    seven_days_ago = datetime.now(UTC) - timedelta(days=7)
    recent_tickets_7d = db.scalar(
        select(func.count())
        .select_from(SupportTicket)
        .where(
            SupportTicket.organization_id == organization_id,
            SupportTicket.created_at >= seven_days_ago,
        )
    ) or 0

    unassigned_tickets = db.scalar(
        select(func.count())
        .select_from(SupportTicket)
        .where(
            SupportTicket.organization_id == organization_id,
            SupportTicket.assigned_user_id.is_(None),
            SupportTicket.assigned_ai_employee_id.is_(None),
            SupportTicket.status.not_in(
                [SupportTicketStatus.RESOLVED, SupportTicketStatus.CLOSED],
            ),
        )
    ) or 0

    return {
        "total_tickets": total_tickets,
        "open_tickets": tickets_by_status.get(SupportTicketStatus.OPEN.value, 0),
        "in_progress_tickets": tickets_by_status.get(SupportTicketStatus.IN_PROGRESS.value, 0),
        "resolved_tickets": tickets_by_status.get(SupportTicketStatus.RESOLVED.value, 0),
        "closed_tickets": tickets_by_status.get(SupportTicketStatus.CLOSED.value, 0),
        "tickets_by_status": tickets_by_status,
        "tickets_by_priority": tickets_by_priority,
        "tickets_by_category": tickets_by_category,
        "total_messages": total_messages,
        "recent_tickets_7d": recent_tickets_7d,
        "unassigned_tickets": unassigned_tickets,
    }
