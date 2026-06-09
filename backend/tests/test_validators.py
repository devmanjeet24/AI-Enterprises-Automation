"""Unit tests for reusable schema validators."""

import pytest
from pydantic import BaseModel, ValidationError

from app.schemas.validators import (
    StrippedEmail,
    StrippedFirstName,
    StrippedLastName,
    StrippedOrganizationName,
    StrippedPassword,
    strip_and_require_non_empty,
    strip_optional_non_empty,
    strip_password,
)


class SamplePasswordModel(BaseModel):
    password: StrippedPassword


class SampleNameModel(BaseModel):
    first_name: StrippedFirstName


class SampleOptionalOrgModel(BaseModel):
    organization_name: StrippedOrganizationName = None


class SampleEmailModel(BaseModel):
    email: StrippedEmail


@pytest.mark.parametrize(
    ("value", "field_label"),
    [
        ("", "Name"),
        ("   ", "Name"),
        ("\t\n", "Name"),
        (None, "Name"),
    ],
)
def test_strip_and_require_non_empty_rejects_blank_values(value: object, field_label: str) -> None:
    with pytest.raises(ValueError, match="cannot be empty or contain only whitespace|is required"):
        strip_and_require_non_empty(value, field_label=field_label)


def test_strip_and_require_non_empty_trims_valid_input() -> None:
    assert strip_and_require_non_empty("  Rahul  ", field_label="First name") == "Rahul"


@pytest.mark.parametrize("value", ["", "   ", "\t"])
def test_strip_optional_non_empty_rejects_whitespace_only_when_provided(value: str) -> None:
    with pytest.raises(ValueError, match="Organization name cannot be empty or contain only whitespace"):
        strip_optional_non_empty(value, field_label="Organization name")


@pytest.mark.parametrize("value", [None])
def test_strip_optional_non_empty_allows_none(value: None) -> None:
    assert strip_optional_non_empty(value, field_label="Organization name") is None


def test_strip_password_rejects_whitespace_only() -> None:
    with pytest.raises(ValueError, match="Password cannot be empty or contain only whitespace"):
        strip_password("          ")


def test_strip_password_enforces_min_length_after_trim() -> None:
    with pytest.raises(ValueError, match="at least 8 characters"):
        strip_password("   short   ")


def test_strip_password_accepts_trimmed_valid_password() -> None:
    model = SamplePasswordModel.model_validate({"password": "  securepass123  "})
    assert model.password == "securepass123"


def test_stripped_name_trims_and_rejects_whitespace_only() -> None:
    model = SampleNameModel.model_validate({"first_name": "  Manjeet  "})
    assert model.first_name == "Manjeet"

    with pytest.raises(ValidationError) as exc_info:
        SampleNameModel.model_validate({"first_name": "   "})

    assert "First name cannot be empty or contain only whitespace" in str(exc_info.value)


def test_stripped_optional_org_name_rejects_whitespace_only() -> None:
    with pytest.raises(ValidationError) as exc_info:
        SampleOptionalOrgModel.model_validate({"organization_name": "     "})

    assert "Organization name cannot be empty or contain only whitespace" in str(exc_info.value)


def test_stripped_email_trims_before_validation() -> None:
    model = SampleEmailModel.model_validate({"email": "  user@example.com  "})
    assert model.email == "user@example.com"

    with pytest.raises(ValidationError):
        SampleEmailModel.model_validate({"email": "   "})

    with pytest.raises(ValidationError):
        SampleEmailModel.model_validate({"email": None})
