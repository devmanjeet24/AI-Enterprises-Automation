"""Pydantic schemas for omnichannel channels."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import OmnichannelChannelType
from app.schemas.validators import (
    StrippedBrowserProfileName,
    StrippedOptionalBrowserProfileName,
    StrippedOptionalBrowserProfileSlug,
    StrippedOptionalDescription,
)


class OmnichannelChannelCreateRequest(BaseModel):
    name: StrippedBrowserProfileName
    slug: StrippedOptionalBrowserProfileSlug = None
    description: StrippedOptionalDescription = None
    channel_type: OmnichannelChannelType
    ai_employee_id: uuid.UUID | None = None
    config: dict[str, Any] | None = None


class OmnichannelChannelUpdateRequest(BaseModel):
    name: StrippedOptionalBrowserProfileName = None
    slug: StrippedOptionalBrowserProfileSlug = None
    description: StrippedOptionalDescription = None
    channel_type: OmnichannelChannelType | None = None
    ai_employee_id: uuid.UUID | None = None
    config: dict[str, Any] | None = None
    is_active: bool | None = None


class OmnichannelChannelResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    ai_employee_id: uuid.UUID | None
    created_by_id: uuid.UUID | None
    name: str
    slug: str
    channel_type: OmnichannelChannelType
    description: str | None
    config: dict[str, Any] | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OmnichannelChannelDetailResponse(OmnichannelChannelResponse):
    ai_employee_name: str | None = None
    conversation_count: int = 0


class OmnichannelAnalyticsResponse(BaseModel):
    total_channels: int
    active_channels: int
    total_conversations: int
    open_conversations: int
    waiting_human_conversations: int
    resolved_conversations: int
    total_messages: int
    recent_conversations_7d: int
    pending_handoffs: int
    conversations_by_status: dict[str, int]
    conversations_by_channel_type: dict[str, int]
    messages_by_role: dict[str, int]
    conversations_by_channel: dict[str, int]
