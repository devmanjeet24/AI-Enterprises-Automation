"""Pydantic schemas for multi-agent collaboration teams."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.validators import (
    StrippedAgentTeamName,
    StrippedCollaborationRole,
    StrippedOptionalAgentTeamName,
    StrippedOptionalAgentTeamSlug,
    StrippedOptionalDescription,
)


class AgentTeamCreateRequest(BaseModel):
    name: StrippedAgentTeamName
    slug: StrippedOptionalAgentTeamSlug = None
    description: StrippedOptionalDescription = None


class AgentTeamUpdateRequest(BaseModel):
    name: StrippedOptionalAgentTeamName = None
    slug: StrippedOptionalAgentTeamSlug = None
    description: StrippedOptionalDescription = None
    is_active: bool | None = None


class AgentTeamResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    created_by_id: uuid.UUID | None
    name: str
    slug: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgentTeamMemberAddRequest(BaseModel):
    ai_employee_id: uuid.UUID
    collaboration_role: StrippedCollaborationRole
    sequence_order: int = Field(default=0, ge=0)


class AgentTeamMemberResponse(BaseModel):
    id: uuid.UUID
    agent_team_id: uuid.UUID
    ai_employee_id: uuid.UUID
    collaboration_role: str
    sequence_order: int
    added_at: datetime
    employee_name: str
    employee_role: str
    employee_status: str

    model_config = {"from_attributes": True}
