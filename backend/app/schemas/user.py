"""Pydantic schemas for user management request/response bodies."""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.auth import RoleSummary
from app.schemas.validators import (
    StrippedEmail,
    StrippedFirstName,
    StrippedLastName,
    StrippedOptionalFirstName,
    StrippedOptionalLastName,
    StrippedPassword,
)


class UserCreateRequest(BaseModel):
    email: StrippedEmail
    password: StrippedPassword
    first_name: StrippedFirstName
    last_name: StrippedLastName
    role_id: uuid.UUID | None = None


class UserUpdateRequest(BaseModel):
    first_name: StrippedOptionalFirstName = None
    last_name: StrippedOptionalLastName = None
    is_active: bool | None = None


class UserRoleAssignRequest(BaseModel):
    role_id: uuid.UUID


class UserInviteRequest(BaseModel):
    email: StrippedEmail
    first_name: StrippedOptionalFirstName = None
    last_name: StrippedOptionalLastName = None
    role_id: uuid.UUID | None = None


class UserInvitationAcceptRequest(BaseModel):
    token: str
    password: StrippedPassword
    first_name: StrippedOptionalFirstName = None
    last_name: StrippedOptionalLastName = None


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


class UserInvitationResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    email: EmailStr
    first_name: str | None
    last_name: str | None
    role: RoleSummary
    invited_by_id: uuid.UUID | None
    accepted_by_id: uuid.UUID | None
    invite_url: str | None = None
    expires_at: datetime
    accepted_at: datetime | None
    created_at: datetime
    updated_at: datetime


class UserRoleAssignmentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role_id: uuid.UUID
    role_slug: str
    role_name: str
    created_at: datetime
