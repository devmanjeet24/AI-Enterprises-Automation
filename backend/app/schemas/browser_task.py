"""Pydantic schemas for browser automation task definitions."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import BrowserTaskExecutionStatus, BrowserTaskStatus
from app.schemas.validators import (
    StrippedBrowserTaskName,
    StrippedOptionalBrowserTaskName,
    StrippedOptionalBrowserTaskSlug,
    StrippedOptionalDescription,
    StrippedOptionalTargetUrl,
)


class BrowserTaskCreateRequest(BaseModel):
    name: StrippedBrowserTaskName
    slug: StrippedOptionalBrowserTaskSlug = None
    description: StrippedOptionalDescription = None
    browser_profile_id: uuid.UUID
    target_url: StrippedOptionalTargetUrl = None
    instructions: StrippedOptionalDescription = None
    config: dict[str, Any] | None = None


class BrowserTaskUpdateRequest(BaseModel):
    name: StrippedOptionalBrowserTaskName = None
    slug: StrippedOptionalBrowserTaskSlug = None
    description: StrippedOptionalDescription = None
    browser_profile_id: uuid.UUID | None = None
    target_url: StrippedOptionalTargetUrl = None
    instructions: StrippedOptionalDescription = None
    status: BrowserTaskStatus | None = None
    config: dict[str, Any] | None = None


class BrowserTaskResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    browser_profile_id: uuid.UUID
    created_by_id: uuid.UUID | None
    name: str
    slug: str
    description: str | None
    target_url: str | None
    instructions: str | None
    status: BrowserTaskStatus
    config: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BrowserTaskExecutionResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    browser_task_id: uuid.UUID
    browser_profile_id: uuid.UUID
    created_by_id: uuid.UUID | None
    status: BrowserTaskExecutionStatus
    result: dict[str, Any] | None
    logs: list[dict[str, Any]] | None
    execution_metadata: dict[str, Any] | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BrowserTaskExecutionSummaryResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    browser_task_id: uuid.UUID
    browser_profile_id: uuid.UUID
    status: BrowserTaskExecutionStatus
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class BrowserAnalyticsResponse(BaseModel):
    total_profiles: int
    active_profiles: int
    total_tasks: int
    ready_tasks: int
    tasks_by_status: dict[str, int]
    total_executions: int
    completed_executions: int
    failed_executions: int
    executions_by_status: dict[str, int]
    recent_executions_7d: int
