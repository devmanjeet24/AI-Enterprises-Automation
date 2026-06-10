"""Pydantic schemas for AI Employee Studio request/response bodies."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import AIEmployeeStatus
from app.schemas.validators import (
    StrippedAIEmployeeName,
    StrippedAIEmployeeRole,
    StrippedAIEmployeeSystemPrompt,
    StrippedOptionalAIEmployeeName,
    StrippedOptionalAIEmployeeRole,
    StrippedOptionalAIEmployeeSystemPrompt,
    StrippedOptionalDescription,
    StrippedToolSlug,
)


class AIEmployeeCreateRequest(BaseModel):
    name: StrippedAIEmployeeName
    role: StrippedAIEmployeeRole
    description: StrippedOptionalDescription = None
    system_prompt: StrippedAIEmployeeSystemPrompt
    status: AIEmployeeStatus = AIEmployeeStatus.INACTIVE


class AIEmployeeUpdateRequest(BaseModel):
    name: StrippedOptionalAIEmployeeName = None
    role: StrippedOptionalAIEmployeeRole = None
    description: StrippedOptionalDescription = None
    system_prompt: StrippedOptionalAIEmployeeSystemPrompt = None
    status: AIEmployeeStatus | None = None


class AIEmployeeDocumentResponse(BaseModel):
    ai_employee_id: uuid.UUID
    knowledge_document_id: uuid.UUID
    assigned_at: datetime

    model_config = {"from_attributes": True}


class AIEmployeeToolResponse(BaseModel):
    id: uuid.UUID
    ai_employee_id: uuid.UUID
    tool_slug: str
    is_enabled: bool
    config: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AIEmployeeToolAssignmentRequest(BaseModel):
    tool_slug: StrippedToolSlug
    is_enabled: bool = True
    config: dict[str, Any] | None = None


class AIEmployeeKnowledgeAssignmentRequest(BaseModel):
    knowledge_document_ids: list[uuid.UUID] = Field(min_length=0)


class AIEmployeeResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    created_by_id: uuid.UUID | None
    name: str
    role: str
    description: str | None
    system_prompt: str
    status: AIEmployeeStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AIEmployeeDetailResponse(AIEmployeeResponse):
    document_assignments: list[AIEmployeeDocumentResponse] = Field(default_factory=list)
    tools: list[AIEmployeeToolResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}
