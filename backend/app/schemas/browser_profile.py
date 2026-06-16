"""Pydantic schemas for browser automation profiles."""

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


class BrowserProfileCreateRequest(BaseModel):
    name: StrippedBrowserProfileName
    slug: StrippedOptionalBrowserProfileSlug = None
    description: StrippedOptionalDescription = None
    user_agent: str | None = Field(default=None, max_length=512)
    viewport_width: int | None = Field(default=None, ge=1, le=10000)
    viewport_height: int | None = Field(default=None, ge=1, le=10000)
    config: dict[str, Any] | None = None
    session_persistence_enabled: bool = False


class BrowserProfileUpdateRequest(BaseModel):
    name: StrippedOptionalBrowserProfileName = None
    slug: StrippedOptionalBrowserProfileSlug = None
    description: StrippedOptionalDescription = None
    user_agent: str | None = Field(default=None, max_length=512)
    viewport_width: int | None = Field(default=None, ge=1, le=10000)
    viewport_height: int | None = Field(default=None, ge=1, le=10000)
    config: dict[str, Any] | None = None
    is_active: bool | None = None
    session_persistence_enabled: bool | None = None


class BrowserProfileResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    created_by_id: uuid.UUID | None
    name: str
    slug: str
    description: str | None
    user_agent: str | None
    viewport_width: int | None
    viewport_height: int | None
    config: dict[str, Any] | None
    is_active: bool
    session_persistence_enabled: bool
    session_updated_at: datetime | None
    session_stored: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
