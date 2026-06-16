"""Pydantic schemas for support tickets and messages."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import SupportMessageRole, SupportTicketPriority, SupportTicketStatus
from app.schemas.validators import (
    StrippedOptionalDescription,
    StrippedOptionalSupportTicketSlug,
    StrippedOptionalSupportTicketSubject,
    StrippedSupportMessageContent,
    StrippedSupportTicketSubject,
    strip_optional_text,
)
from pydantic import field_validator


class SupportTicketCreateRequest(BaseModel):
    subject: StrippedSupportTicketSubject
    slug: StrippedOptionalSupportTicketSlug = None
    description: StrippedOptionalDescription = None
    category_id: uuid.UUID | None = None
    customer_name: str | None = Field(default=None, max_length=200)
    customer_email: EmailStr | None = None
    priority: SupportTicketPriority = SupportTicketPriority.NORMAL
    assigned_user_id: uuid.UUID | None = None
    assigned_ai_employee_id: uuid.UUID | None = None
    initial_message: StrippedSupportMessageContent | None = None

    @field_validator("customer_name", mode="before")
    @classmethod
    def normalize_customer_name(cls, value: object) -> str | None:
        return strip_optional_text(value)


class SupportTicketUpdateRequest(BaseModel):
    subject: StrippedOptionalSupportTicketSubject = None
    slug: StrippedOptionalSupportTicketSlug = None
    description: StrippedOptionalDescription = None
    category_id: uuid.UUID | None = None
    customer_name: str | None = Field(default=None, max_length=200)
    customer_email: EmailStr | None = None
    status: SupportTicketStatus | None = None
    priority: SupportTicketPriority | None = None
    assigned_user_id: uuid.UUID | None = None
    assigned_ai_employee_id: uuid.UUID | None = None

    @field_validator("customer_name", mode="before")
    @classmethod
    def normalize_customer_name(cls, value: object) -> str | None:
        return strip_optional_text(value)


class SupportTicketResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    category_id: uuid.UUID | None
    created_by_id: uuid.UUID | None
    assigned_user_id: uuid.UUID | None
    assigned_ai_employee_id: uuid.UUID | None
    subject: str
    slug: str
    description: str | None
    customer_name: str | None
    customer_email: str | None
    status: SupportTicketStatus
    priority: SupportTicketPriority
    resolved_at: datetime | None = None
    resolved_message_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SupportTicketDetailResponse(SupportTicketResponse):
    category_name: str | None = None
    assigned_user_name: str | None = None
    assigned_ai_employee_name: str | None = None
    message_count: int = 0
    has_resolution: bool = False


class SupportMessageCreateRequest(BaseModel):
    content: StrippedSupportMessageContent
    role: SupportMessageRole = SupportMessageRole.AGENT
    is_internal: bool = False
    resolve_ticket: bool = False
    as_ai_employee: bool = False


class SupportMessageResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    author_user_id: uuid.UUID | None
    author_ai_employee_id: uuid.UUID | None
    role: SupportMessageRole
    content: str
    is_internal: bool
    created_at: datetime
    updated_at: datetime
    author_user_name: str | None = None
    author_ai_employee_name: str | None = None

    model_config = {"from_attributes": True}


class SupportAiSuggestionResponse(BaseModel):
    suggestion: str
    sources: list[dict[str, Any]] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    recommended_status: SupportTicketStatus
    reasoning: str
    can_auto_resolve: bool = False


class SupportAnalyticsResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int
    tickets_by_status: dict[str, int]
    tickets_by_priority: dict[str, int]
    tickets_by_category: dict[str, int]
    total_messages: int
    recent_tickets_7d: int
    unassigned_tickets: int
