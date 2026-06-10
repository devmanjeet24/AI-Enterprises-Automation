"""Pydantic schemas for user management request/response bodies."""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.auth import RoleSummary
from app.schemas.validators import StrippedOptionalFirstName, StrippedOptionalLastName


class UserUpdateRequest(BaseModel):
    first_name: StrippedOptionalFirstName = None
    last_name: StrippedOptionalLastName = None
    is_active: bool | None = None


class UserRoleAssignRequest(BaseModel):
    role_id: uuid.UUID


class UserResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool
    roles: list[RoleSummary]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserRoleAssignmentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role_id: uuid.UUID
    role_slug: str
    role_name: str
    created_at: datetime
