"""Pydantic schemas for support ticket categories."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.validators import (
    StrippedOptionalDescription,
    StrippedOptionalSupportCategoryName,
    StrippedOptionalSupportCategorySlug,
    StrippedSupportCategoryName,
)


class SupportCategoryCreateRequest(BaseModel):
    name: StrippedSupportCategoryName
    slug: StrippedOptionalSupportCategorySlug = None
    description: StrippedOptionalDescription = None
    color: str | None = None


class SupportCategoryUpdateRequest(BaseModel):
    name: StrippedOptionalSupportCategoryName = None
    slug: StrippedOptionalSupportCategorySlug = None
    description: StrippedOptionalDescription = None
    color: str | None = None
    is_active: bool | None = None


class SupportCategoryResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    slug: str
    description: str | None
    color: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
