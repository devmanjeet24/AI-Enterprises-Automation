"""Pydantic schemas for team request/response bodies."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.validators import (
    StrippedOptionalDescription,
    StrippedOptionalTeamName,
    StrippedOptionalTeamSlug,
    StrippedTeamName,
)


class TeamCreateRequest(BaseModel):
    department_id: uuid.UUID
    name: StrippedTeamName
    slug: StrippedOptionalTeamSlug = None
    description: StrippedOptionalDescription = None


class TeamUpdateRequest(BaseModel):
    department_id: uuid.UUID | None = None
    name: StrippedOptionalTeamName = None
    slug: StrippedOptionalTeamSlug = None
    description: StrippedOptionalDescription = None
    is_active: bool | None = None


class TeamResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    department_id: uuid.UUID
    name: str
    slug: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
