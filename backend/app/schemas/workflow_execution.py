"""Pydantic schemas for workflow execution history."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import AgentTaskStatus
from app.schemas.agent_task import AgentTaskResponse


class WorkflowRunRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = None
    input_payload: dict[str, Any] | None = None


class WorkflowExecutionResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    workflow_id: uuid.UUID
    agent_task_id: uuid.UUID | None
    created_by_id: uuid.UUID | None
    status: AgentTaskStatus
    final_output: str | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    agent_task: AgentTaskResponse | None = None

    model_config = {"from_attributes": True}


class WorkflowExecutionSummaryResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    workflow_id: uuid.UUID
    agent_task_id: uuid.UUID | None
    created_by_id: uuid.UUID | None
    status: AgentTaskStatus
    final_output: str | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
