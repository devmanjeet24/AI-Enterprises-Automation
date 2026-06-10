"""Pydantic schemas for role management request/response bodies."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.validators import (
    StrippedOptionalDescription,
    StrippedOptionalRoleName,
    StrippedOptionalRoleSlug,
    StrippedRoleName,
)


class RoleCreateRequest(BaseModel):
    name: StrippedRoleName
    slug: StrippedOptionalRoleSlug = None
    description: StrippedOptionalDescription = None


class RoleUpdateRequest(BaseModel):
    name: StrippedOptionalRoleName = None
    slug: StrippedOptionalRoleSlug = None
    description: StrippedOptionalDescription = None
    is_active: bool | None = None


class PermissionSummary(BaseModel):
    id: uuid.UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}


class RoleResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    slug: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RoleDetailResponse(RoleResponse):
    permissions: list[PermissionSummary]
