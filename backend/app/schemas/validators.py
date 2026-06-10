"""Reusable Pydantic validators for request schemas."""

import re
from collections.abc import Callable
from typing import Annotated, Any

from pydantic import BeforeValidator, EmailStr, Field

from app.core.text import slugify

PERMISSION_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$")


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


def strip_optional_text(value: Any) -> str | None:
    """Trim optional free-text fields; blank values become None."""
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("Description must be a string")
    stripped = value.strip()
    return stripped or None


def strip_password(value: Any) -> str:
    """Trim password input and enforce minimum length after trimming."""
    stripped = strip_and_require_non_empty(value, field_label="Password")
    if len(stripped) < 8:
        raise ValueError(
            "Password must be at least 8 characters long after removing leading and trailing spaces"
        )
    if len(stripped) > 128:
        raise ValueError("Password must be at most 128 characters long")
    return stripped


def strip_email(value: Any) -> str:
    """Trim email input before EmailStr format validation runs."""
    return strip_and_require_non_empty(value, field_label="Email")


def normalize_slug(value: Any, *, field_label: str, max_length: int) -> str:
    """Trim and normalize a required slug."""
    stripped = strip_and_require_non_empty(value, field_label=field_label)
    normalized = slugify(stripped)
    if not normalized:
        raise ValueError(f"{field_label} must contain at least one letter or number")
    return normalized[:max_length]


def normalize_optional_slug(value: Any, *, field_label: str, max_length: int) -> str | None:
    """Trim and normalize an optional slug."""
    if value is None:
        return None
    return normalize_slug(value, field_label=field_label, max_length=max_length)


def make_required_strip_validator(field_label: str) -> Callable[[Any], str]:
    def validate(value: Any) -> str:
        return strip_and_require_non_empty(value, field_label=field_label)

    return validate


def make_optional_strip_validator(
    field_label: str,
    max_length: int | None = None,
) -> Callable[[Any], str | None]:
    def validate(value: Any) -> str | None:
        if value is None:
            return None
        result = strip_and_require_non_empty(value, field_label=field_label)
        if max_length is not None and len(result) > max_length:
            raise ValueError(f"{field_label} must be at most {max_length} characters")
        return result

    return validate


def make_optional_slug_validator(field_label: str, max_length: int) -> Callable[[Any], str | None]:
    def validate(value: Any) -> str | None:
        return normalize_optional_slug(value, field_label=field_label, max_length=max_length)

    return validate


def normalize_permission_slug(value: Any, *, field_label: str, max_length: int = 100) -> str:
    """Trim and validate resource:action permission slugs."""
    stripped = strip_and_require_non_empty(value, field_label=field_label)
    normalized = stripped.lower().replace(" ", "")
    if not PERMISSION_SLUG_PATTERN.match(normalized):
        raise ValueError(
            f"{field_label} must use resource:action format (for example, departments:read)"
        )
    return normalized[:max_length]


def normalize_optional_permission_slug(
    value: Any,
    *,
    field_label: str,
    max_length: int = 100,
) -> str | None:
    if value is None:
        return None
    return normalize_permission_slug(value, field_label=field_label, max_length=max_length)


def make_required_permission_slug_validator(field_label: str) -> Callable[[Any], str]:
    def validate(value: Any) -> str:
        return normalize_permission_slug(value, field_label=field_label)

    return validate


def make_optional_permission_slug_validator(field_label: str) -> Callable[[Any], str | None]:
    def validate(value: Any) -> str | None:
        return normalize_optional_permission_slug(value, field_label=field_label)

    return validate


# --- Authentication / user fields ---

StrippedEmail = Annotated[EmailStr, BeforeValidator(strip_email)]
StrippedPassword = Annotated[str, BeforeValidator(strip_password)]
StrippedFirstName = Annotated[
    str,
    BeforeValidator(make_required_strip_validator("First name")),
    Field(max_length=100),
]
StrippedLastName = Annotated[
    str,
    BeforeValidator(make_required_strip_validator("Last name")),
    Field(max_length=100),
]
StrippedOrganizationName = Annotated[
    str | None,
    BeforeValidator(make_optional_strip_validator("Organization name", max_length=255)),
]
StrippedOrganizationSlug = Annotated[
    str | None,
    BeforeValidator(make_optional_slug_validator("Organization slug", max_length=100)),
]

# --- Department fields ---

StrippedDepartmentName = Annotated[
    str,
    BeforeValidator(make_required_strip_validator("Department name")),
    Field(max_length=100),
]
StrippedOptionalDepartmentName = Annotated[
    str | None,
    BeforeValidator(make_optional_strip_validator("Department name", max_length=100)),
]
StrippedOptionalDepartmentSlug = Annotated[
    str | None,
    BeforeValidator(make_optional_slug_validator("Department slug", max_length=50)),
]
StrippedOptionalDescription = Annotated[
    str | None,
    BeforeValidator(strip_optional_text),
]

# --- Team fields ---

StrippedTeamName = Annotated[
    str,
    BeforeValidator(make_required_strip_validator("Team name")),
    Field(max_length=100),
]
StrippedOptionalTeamName = Annotated[
    str | None,
    BeforeValidator(make_optional_strip_validator("Team name", max_length=100)),
]
StrippedOptionalTeamSlug = Annotated[
    str | None,
    BeforeValidator(make_optional_slug_validator("Team slug", max_length=50)),
]

# --- Permission fields ---

StrippedPermissionName = Annotated[
    str,
    BeforeValidator(make_required_strip_validator("Permission name")),
    Field(max_length=100),
]
StrippedOptionalPermissionName = Annotated[
    str | None,
    BeforeValidator(make_optional_strip_validator("Permission name", max_length=100)),
]
StrippedPermissionSlug = Annotated[
    str,
    BeforeValidator(make_required_permission_slug_validator("Permission slug")),
    Field(max_length=100),
]
StrippedOptionalPermissionSlug = Annotated[
    str | None,
    BeforeValidator(make_optional_permission_slug_validator("Permission slug")),
]

# --- Role fields ---

StrippedRoleName = Annotated[
    str,
    BeforeValidator(make_required_strip_validator("Role name")),
    Field(max_length=100),
]
StrippedOptionalRoleName = Annotated[
    str | None,
    BeforeValidator(make_optional_strip_validator("Role name", max_length=100)),
]
StrippedOptionalRoleSlug = Annotated[
    str | None,
    BeforeValidator(make_optional_slug_validator("Role slug", max_length=50)),
]

# --- User management fields ---

StrippedOptionalFirstName = Annotated[
    str | None,
    BeforeValidator(make_optional_strip_validator("First name", max_length=100)),
]
StrippedOptionalLastName = Annotated[
    str | None,
    BeforeValidator(make_optional_strip_validator("Last name", max_length=100)),
]

# --- Shared aliases for future modules (Organizations API) ---

StrippedName = Annotated[
    str,
    BeforeValidator(make_required_strip_validator("Name")),
    Field(max_length=100),
]
StrippedOptionalName = Annotated[
    str | None,
    BeforeValidator(make_optional_strip_validator("Name", max_length=100)),
]
StrippedOptionalSlug = Annotated[
    str | None,
    BeforeValidator(make_optional_slug_validator("Slug", max_length=100)),
]
