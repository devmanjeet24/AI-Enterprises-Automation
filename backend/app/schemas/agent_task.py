"""Pydantic schemas for multi-agent collaboration tasks."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import AgentTaskExecutionStatus, AgentTaskStatus
from app.schemas.validators import (
    StrippedAgentTaskDescription,
    StrippedAgentTaskTitle,
)


class AgentTaskCreateRequest(BaseModel):
    title: StrippedAgentTaskTitle
    description: StrippedAgentTaskDescription
    input_payload: dict[str, Any] | None = None


class AgentTaskExecutionResponse(BaseModel):
    id: uuid.UUID
    agent_task_id: uuid.UUID
    ai_employee_id: uuid.UUID
    agent_team_member_id: uuid.UUID | None
    sequence_order: int
    status: AgentTaskExecutionStatus
    input_summary: str | None
    output: str | None
    output_payload: dict[str, Any] | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    employee_name: str | None = None
    collaboration_role: str | None = None

    model_config = {"from_attributes": True}


class AgentTaskResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    agent_team_id: uuid.UUID
    created_by_id: uuid.UUID | None
    title: str
    description: str
    status: AgentTaskStatus
    input_payload: dict[str, Any] | None
    result: str | None
    created_at: datetime
    updated_at: datetime
    executions: list[AgentTaskExecutionResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class AgentTaskSummaryResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    agent_team_id: uuid.UUID
    created_by_id: uuid.UUID | None
    title: str
    description: str
    status: AgentTaskStatus
    input_payload: dict[str, Any] | None
    result: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
