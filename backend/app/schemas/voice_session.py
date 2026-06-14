"""Pydantic schemas for voice AI sessions and transcripts."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import VoiceSessionStatus, VoiceTranscriptRole


class VoiceSessionCreateRequest(BaseModel):
    voice_agent_id: uuid.UUID
    title: str | None = Field(default=None, max_length=255)


class VoiceSessionUpdateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)


class VoiceTranscriptResponse(BaseModel):
    id: uuid.UUID
    voice_session_id: uuid.UUID
    author_ai_employee_id: uuid.UUID | None
    role: VoiceTranscriptRole
    content: str
    metadata: dict[str, Any] | None = Field(
        default=None,
        validation_alias="metadata_",
        serialization_alias="metadata",
    )
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class VoiceSessionResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    voice_agent_id: uuid.UUID
    created_by_id: uuid.UUID | None
    title: str | None
    status: VoiceSessionStatus
    audio_file_path: str | None
    audio_mime_type: str | None
    audio_duration_seconds: float | None
    result: dict[str, Any] | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VoiceSessionDetailResponse(VoiceSessionResponse):
    voice_agent_name: str | None = None
    ai_employee_name: str | None = None
    transcripts: list[VoiceTranscriptResponse] = Field(default_factory=list)


class VoiceSessionSummaryResponse(VoiceSessionResponse):
    voice_agent_name: str | None = None
    transcript_count: int = 0
