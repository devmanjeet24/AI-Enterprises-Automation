"""Pydantic schemas for organization request/response bodies."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.validators import StrippedOptionalDescription, StrippedOrganizationName


class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrganizationUpdateRequest(BaseModel):
    name: StrippedOrganizationName = None
    description: StrippedOptionalDescription = None
