"""Pydantic schemas for voice AI agents."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.validators import (
    StrippedBrowserProfileName,
    StrippedOptionalBrowserProfileName,
    StrippedOptionalBrowserProfileSlug,
    StrippedOptionalDescription,
)


class VoiceAgentCreateRequest(BaseModel):
    name: StrippedBrowserProfileName
    slug: StrippedOptionalBrowserProfileSlug = None
    description: StrippedOptionalDescription = None
    ai_employee_id: uuid.UUID
    config: dict[str, Any] | None = None


class VoiceAgentUpdateRequest(BaseModel):
    name: StrippedOptionalBrowserProfileName = None
    slug: StrippedOptionalBrowserProfileSlug = None
    description: StrippedOptionalDescription = None
    ai_employee_id: uuid.UUID | None = None
    config: dict[str, Any] | None = None
    is_active: bool | None = None


class VoiceAgentResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    ai_employee_id: uuid.UUID
    created_by_id: uuid.UUID | None
    name: str
    slug: str
    description: str | None
    config: dict[str, Any] | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VoiceAgentDetailResponse(VoiceAgentResponse):
    ai_employee_name: str | None = None
    session_count: int = 0


class VoiceAnalyticsResponse(BaseModel):
    total_agents: int
    active_agents: int
    total_sessions: int
    completed_sessions: int
    failed_sessions: int
    processing_sessions: int
    pending_sessions: int
    total_transcripts: int
    recent_sessions_7d: int
    sessions_by_status: dict[str, int]
    transcripts_by_role: dict[str, int]
    sessions_by_agent: dict[str, int]
