"""Reusable Pydantic validators for request schemas."""

from typing import Annotated, Any

from pydantic import BeforeValidator, EmailStr, Field


def strip_and_require_non_empty(value: Any, *, field_label: str) -> str:
    """Trim whitespace and reject empty or whitespace-only strings."""
    if value is None:
        raise ValueError(f"{field_label} is required")
    if not isinstance(value, str):
        raise ValueError(f"{field_label} must be a string")
    stripped = value.strip()
    if not stripped:
        raise ValueError(f"{field_label} cannot be empty or contain only whitespace")
    return stripped


def strip_optional_non_empty(value: Any, *, field_label: str) -> str | None:
    """Trim optional strings; reject whitespace-only when a value is provided."""
    if value is None:
        return None
    return strip_and_require_non_empty(value, field_label=field_label)


def strip_password(value: Any) -> str:
    """Trim password input and enforce minimum length after trimming."""
    stripped = strip_and_require_non_empty(value, field_label="Password")
    if len(stripped) < 8:
        raise ValueError("Password must be at least 8 characters long after removing leading and trailing spaces")
    if len(stripped) > 128:
        raise ValueError("Password must be at most 128 characters long")
    return stripped


def strip_email(value: Any) -> str:
    """Trim email input before EmailStr format validation runs."""
    return strip_and_require_non_empty(value, field_label="Email")


def _strip_first_name(value: Any) -> str:
    return strip_and_require_non_empty(value, field_label="First name")


def _strip_last_name(value: Any) -> str:
    return strip_and_require_non_empty(value, field_label="Last name")


def _strip_organization_name(value: Any) -> str | None:
    return strip_optional_non_empty(value, field_label="Organization name")


def _strip_organization_slug(value: Any) -> str | None:
    return strip_optional_non_empty(value, field_label="Organization slug")


StrippedEmail = Annotated[EmailStr, BeforeValidator(strip_email)]
StrippedPassword = Annotated[str, BeforeValidator(strip_password)]
StrippedFirstName = Annotated[
    str,
    BeforeValidator(_strip_first_name),
    Field(max_length=100),
]
StrippedLastName = Annotated[
    str,
    BeforeValidator(_strip_last_name),
    Field(max_length=100),
]
StrippedOrganizationName = Annotated[
    str | None,
    BeforeValidator(_strip_organization_name),
    Field(max_length=255),
]
StrippedOrganizationSlug = Annotated[
    str | None,
    BeforeValidator(_strip_organization_slug),
    Field(max_length=100),
]
