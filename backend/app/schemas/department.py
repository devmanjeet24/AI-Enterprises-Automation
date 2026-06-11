"""Pydantic schemas for department request/response bodies."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.validators import (
    StrippedDepartmentName,
    StrippedOptionalDepartmentName,
    StrippedOptionalDepartmentSlug,
    StrippedOptionalDescription,
)


class DepartmentCreateRequest(BaseModel):
    name: StrippedDepartmentName
    slug: StrippedOptionalDepartmentSlug = None
    description: StrippedOptionalDescription = None


class DepartmentUpdateRequest(BaseModel):
    name: StrippedOptionalDepartmentName = None
    slug: StrippedOptionalDepartmentSlug = None
    description: StrippedOptionalDescription = None
    is_active: bool | None = None


class DepartmentResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    slug: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
