"""Pydantic schemas for authentication request/response bodies."""

import re
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


def slugify(value: str) -> str:
    """Turn a display name into a URL-safe slug."""
    slug = value.strip().lower()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug.strip("-")[:100]


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    organization_name: str | None = Field(default=None, max_length=255)
    organization_slug: str | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def validate_organization_fields(self) -> "UserRegisterRequest":
        has_name = self.organization_name is not None and self.organization_name.strip()
        has_slug = self.organization_slug is not None and self.organization_slug.strip()

        if has_name and has_slug:
            raise ValueError(
                "Provide either organization_name (create new company) "
                "or organization_slug (join existing company), not both."
            )
        if not has_name and not has_slug:
            raise ValueError(
                "Provide organization_name to create a new company "
                "or organization_slug to join an existing one."
            )
        return self


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RoleSummary(BaseModel):
    id: uuid.UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}


class UserMeResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    first_name: str
    last_name: str
    organization_id: uuid.UUID
    organization_name: str
    organization_slug: str
    is_active: bool
    roles: list[RoleSummary]
    created_at: datetime

    model_config = {"from_attributes": True}
