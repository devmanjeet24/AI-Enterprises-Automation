"""Pydantic schemas for workflow automation definitions."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import WorkflowStatus
from app.schemas.validators import (
    StrippedOptionalDescription,
    StrippedOptionalWorkflowName,
    StrippedOptionalWorkflowSlug,
    StrippedWorkflowName,
    StrippedWorkflowStepName,
)


class WorkflowStepInput(BaseModel):
    name: StrippedWorkflowStepName
    description: StrippedOptionalDescription = None
    sequence_order: int = Field(ge=0)
    config: dict[str, Any] | None = None


class WorkflowCreateRequest(BaseModel):
    name: StrippedWorkflowName
    slug: StrippedOptionalWorkflowSlug = None
    description: StrippedOptionalDescription = None
    agent_team_id: uuid.UUID
    steps: list[WorkflowStepInput] = Field(min_length=1)


class WorkflowUpdateRequest(BaseModel):
    name: StrippedOptionalWorkflowName = None
    slug: StrippedOptionalWorkflowSlug = None
    description: StrippedOptionalDescription = None
    agent_team_id: uuid.UUID | None = None
    status: WorkflowStatus | None = None
    is_active: bool | None = None
    steps: list[WorkflowStepInput] | None = None


class WorkflowStepResponse(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    name: str
    description: str | None
    sequence_order: int
    config: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    agent_team_id: uuid.UUID
    created_by_id: uuid.UUID | None
    name: str
    slug: str
    description: str | None
    status: WorkflowStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime
    steps: list[WorkflowStepResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}
