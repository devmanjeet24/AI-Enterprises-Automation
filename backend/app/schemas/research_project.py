"""Pydantic schemas for business research projects and reports."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import AgentTaskStatus, ResearchProjectStatus, ResearchTemplateType
from app.schemas.agent_task import AgentTaskResponse
from app.schemas.validators import (
    StrippedOptionalDescription,
    StrippedOptionalResearchProjectName,
    StrippedOptionalResearchProjectSlug,
    StrippedResearchBrief,
    StrippedResearchProjectName,
)


class ResearchProjectCreateRequest(BaseModel):
    name: StrippedResearchProjectName
    slug: StrippedOptionalResearchProjectSlug = None
    description: StrippedOptionalDescription = None
    research_brief: StrippedResearchBrief
    template_type: ResearchTemplateType
    agent_team_id: uuid.UUID


class ResearchProjectUpdateRequest(BaseModel):
    name: StrippedOptionalResearchProjectName = None
    slug: StrippedOptionalResearchProjectSlug = None
    description: StrippedOptionalDescription = None
    research_brief: StrippedResearchBrief | None = None
    template_type: ResearchTemplateType | None = None
    agent_team_id: uuid.UUID | None = None
    status: ResearchProjectStatus | None = None
    is_active: bool | None = None


class ResearchProjectResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    agent_team_id: uuid.UUID
    created_by_id: uuid.UUID | None
    name: str
    slug: str
    description: str | None
    research_brief: str | None
    template_type: ResearchTemplateType
    status: ResearchProjectStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResearchTemplateStepResponse(BaseModel):
    sequence_order: int
    name: str
    description: str


class ResearchTemplateResponse(BaseModel):
    template_type: ResearchTemplateType
    name: str
    description: str
    steps: list[ResearchTemplateStepResponse]


class ResearchRunRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    input_payload: dict[str, Any] | None = None


class ResearchReportResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    research_project_id: uuid.UUID
    agent_task_id: uuid.UUID | None
    created_by_id: uuid.UUID | None
    version_number: int
    status: AgentTaskStatus
    final_output: str | None
    intermediate_outputs: list[dict[str, Any]] | None
    execution_metadata: dict[str, Any] | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    agent_task: AgentTaskResponse | None = None

    model_config = {"from_attributes": True}


class ResearchReportSummaryResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    research_project_id: uuid.UUID
    agent_task_id: uuid.UUID | None
    created_by_id: uuid.UUID | None
    version_number: int
    status: AgentTaskStatus
    final_output: str | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResearchAnalyticsResponse(BaseModel):
    total_projects: int
    active_projects: int
    projects_by_status: dict[str, int]
    projects_by_template: dict[str, int]
    total_reports: int
    completed_reports: int
    failed_reports: int
    reports_by_status: dict[str, int]
    recent_runs_7d: int


class ResearchExecutionHistoryResponse(BaseModel):
    id: uuid.UUID
    research_project_id: uuid.UUID
    version_number: int
    status: AgentTaskStatus
    final_output: str | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
