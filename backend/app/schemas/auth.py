"""Pydantic schemas for authentication request/response bodies."""

import re
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.schemas.validators import (
    StrippedEmail,
    StrippedFirstName,
    StrippedLastName,
    StrippedOrganizationName,
    StrippedOrganizationSlug,
    StrippedPassword,
)


def slugify(value: str) -> str:
    """Turn a display name into a URL-safe slug."""
    slug = value.strip().lower()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug.strip("-")[:100]


class UserRegisterRequest(BaseModel):
    email: StrippedEmail
    password: StrippedPassword
    first_name: StrippedFirstName
    last_name: StrippedLastName
    organization_name: StrippedOrganizationName = None
    organization_slug: StrippedOrganizationSlug = None

    @model_validator(mode="after")
    def validate_organization_fields(self) -> "UserRegisterRequest":
        has_name = self.organization_name is not None
        has_slug = self.organization_slug is not None

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


class LoginRequest(BaseModel):
    """Validated credentials for the OAuth2 login form."""

    email: StrippedEmail
    password: StrippedPassword

    @classmethod
    def from_form(cls, username: str, password: str) -> "LoginRequest":
        return cls.model_validate({"email": username, "password": password})


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
