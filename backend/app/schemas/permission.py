"""Pydantic schemas for permission request/response bodies."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.validators import (
    StrippedOptionalDescription,
    StrippedOptionalPermissionName,
    StrippedOptionalPermissionSlug,
    StrippedPermissionName,
    StrippedPermissionSlug,
)


class PermissionCreateRequest(BaseModel):
    name: StrippedPermissionName
    slug: StrippedPermissionSlug
    description: StrippedOptionalDescription = None


class PermissionUpdateRequest(BaseModel):
    name: StrippedOptionalPermissionName = None
    slug: StrippedOptionalPermissionSlug = None
    description: StrippedOptionalDescription = None
    is_active: bool | None = None


class PermissionResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    slug: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RolePermissionAssignRequest(BaseModel):
    permission_id: uuid.UUID


class RolePermissionResponse(BaseModel):
    id: uuid.UUID
    role_id: uuid.UUID
    permission_id: uuid.UUID
    permission_slug: str
    permission_name: str
    created_at: datetime

    model_config = {"from_attributes": True}
