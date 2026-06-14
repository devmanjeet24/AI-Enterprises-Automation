"""Pydantic schemas for omnichannel conversations and messages."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import (
    OmnichannelConversationStatus,
    OmnichannelHandoffStatus,
    OmnichannelMessageRole,
)
from app.schemas.validators import (
    StrippedOptionalSupportTicketSlug,
    StrippedOptionalSupportTicketSubject,
    StrippedSupportMessageContent,
    StrippedSupportTicketSubject,
)


class OmnichannelConversationCreateRequest(BaseModel):
    channel_id: uuid.UUID
    subject: StrippedSupportTicketSubject
    slug: StrippedOptionalSupportTicketSlug = None
    external_contact_name: str | None = Field(default=None, max_length=200)
    external_contact_id: str | None = Field(default=None, max_length=255)
    assigned_user_id: uuid.UUID | None = None
    assigned_ai_employee_id: uuid.UUID | None = None
    shared_context: dict[str, Any] | None = None
    initial_message: StrippedSupportMessageContent | None = None


class OmnichannelConversationUpdateRequest(BaseModel):
    subject: StrippedOptionalSupportTicketSubject = None
    slug: StrippedOptionalSupportTicketSlug = None
    external_contact_name: str | None = Field(default=None, max_length=200)
    external_contact_id: str | None = Field(default=None, max_length=255)
    status: OmnichannelConversationStatus | None = None
    handoff_status: OmnichannelHandoffStatus | None = None
    assigned_user_id: uuid.UUID | None = None
    assigned_ai_employee_id: uuid.UUID | None = None
    shared_context: dict[str, Any] | None = None


class OmnichannelMessageCreateRequest(BaseModel):
    content: StrippedSupportMessageContent
    role: OmnichannelMessageRole = OmnichannelMessageRole.AGENT
    is_internal: bool = False


class OmnichannelMessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    author_user_id: uuid.UUID | None
    author_ai_employee_id: uuid.UUID | None
    role: OmnichannelMessageRole
    content: str
    is_internal: bool
    metadata: dict[str, Any] | None = Field(
        default=None,
        validation_alias="metadata_",
        serialization_alias="metadata",
    )
    created_at: datetime
    updated_at: datetime
    author_user_name: str | None = None
    author_ai_employee_name: str | None = None

    model_config = {"from_attributes": True, "populate_by_name": True}


class OmnichannelConversationResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    channel_id: uuid.UUID
    created_by_id: uuid.UUID | None
    assigned_user_id: uuid.UUID | None
    assigned_ai_employee_id: uuid.UUID | None
    subject: str
    slug: str
    external_contact_name: str | None
    external_contact_id: str | None
    status: OmnichannelConversationStatus
    handoff_status: OmnichannelHandoffStatus
    shared_context: dict[str, Any] | None
    last_message_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OmnichannelInboxItemResponse(OmnichannelConversationResponse):
    channel_name: str | None = None
    channel_type: str | None = None
    message_count: int = 0
    last_message_preview: str | None = None


class OmnichannelConversationDetailResponse(OmnichannelConversationResponse):
    channel_name: str | None = None
    channel_type: str | None = None
    assigned_user_name: str | None = None
    assigned_ai_employee_name: str | None = None
    message_count: int = 0
    messages: list[OmnichannelMessageResponse] = Field(default_factory=list)


class OmnichannelAiSuggestionResponse(BaseModel):
    suggestion: str
    sources: list[dict[str, Any]] = Field(default_factory=list)
