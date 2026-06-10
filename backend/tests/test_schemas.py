"""Unit tests for all request Pydantic schemas."""

import uuid

import pytest
from pydantic import ValidationError

from app.schemas.auth import LoginRequest, UserRegisterRequest
from app.schemas.department import DepartmentCreateRequest, DepartmentUpdateRequest
from app.schemas.permission import PermissionCreateRequest, PermissionUpdateRequest
from app.schemas.team import TeamCreateRequest, TeamUpdateRequest


def _valid_register_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "email": "user@example.com",
        "password": "securepass123",
        "first_name": "Valid",
        "last_name": "User",
        "organization_name": "Valid Org",
    }
    payload.update(overrides)
    return payload


class TestUserRegisterRequest:
    def test_accepts_trimmed_valid_input(self) -> None:
        model = UserRegisterRequest.model_validate(
            _valid_register_payload(
                email="  user@example.com  ",
                first_name="  Manjeet  ",
                last_name="  Singh  ",
                organization_name="  Acme Corp  ",
            )
        )
        assert model.email == "user@example.com"
        assert model.first_name == "Manjeet"
        assert model.organization_name == "Acme Corp"

    @pytest.mark.parametrize(
        "field,value,message",
        [
            ("email", "", "Email cannot be empty or contain only whitespace"),
            ("email", "   ", "Email cannot be empty or contain only whitespace"),
            ("password", "        ", "Password cannot be empty or contain only whitespace"),
            ("first_name", "   ", "First name cannot be empty or contain only whitespace"),
            ("last_name", "   ", "Last name cannot be empty or contain only whitespace"),
            ("organization_name", "   ", "Organization name cannot be empty or contain only whitespace"),
        ],
    )
    def test_rejects_empty_and_whitespace_values(self, field: str, value: str, message: str) -> None:
        with pytest.raises(ValidationError) as exc_info:
            UserRegisterRequest.model_validate(_valid_register_payload(**{field: value}))

        assert message in str(exc_info.value)

    @pytest.mark.parametrize(
        "field",
        ["email", "password", "first_name", "last_name"],
    )
    def test_rejects_null_required_fields(self, field: str) -> None:
        with pytest.raises(ValidationError):
            UserRegisterRequest.model_validate(_valid_register_payload(**{field: None}))

    def test_rejects_invalid_email_format(self) -> None:
        with pytest.raises(ValidationError):
            UserRegisterRequest.model_validate(_valid_register_payload(email="not-an-email"))

    def test_rejects_both_organization_fields(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            UserRegisterRequest.model_validate(
                _valid_register_payload(
                    organization_name="Acme",
                    organization_slug="acme",
                )
            )

        assert "not both" in str(exc_info.value)

    def test_rejects_missing_organization_fields(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            UserRegisterRequest.model_validate(
                {
                    "email": "user@example.com",
                    "password": "securepass123",
                    "first_name": "Valid",
                    "last_name": "User",
                }
            )

        assert "organization_name" in str(exc_info.value)

    def test_organization_slug_is_normalized(self) -> None:
        model = UserRegisterRequest.model_validate(
            {
                "email": "user@example.com",
                "password": "securepass123",
                "first_name": "Valid",
                "last_name": "User",
                "organization_slug": "  Demo Corp  ",
            }
        )
        assert model.organization_slug == "demo-corp"


class TestLoginRequest:
    def test_trims_valid_credentials(self) -> None:
        model = LoginRequest.model_validate(
            {"email": "  user@example.com  ", "password": "  securepass123  "}
        )
        assert model.email == "user@example.com"
        assert model.password == "securepass123"

    def test_rejects_whitespace_only_password(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            LoginRequest.model_validate({"email": "user@example.com", "password": "          "})

        assert "Password cannot be empty or contain only whitespace" in str(exc_info.value)

    def test_rejects_invalid_email(self) -> None:
        with pytest.raises(ValidationError):
            LoginRequest.model_validate({"email": "bad-email", "password": "securepass123"})


class TestDepartmentCreateRequest:
    def test_trims_valid_input(self) -> None:
        model = DepartmentCreateRequest.model_validate(
            {
                "name": "  Engineering  ",
                "slug": "  Platform Team  ",
                "description": "  Builds core systems  ",
            }
        )
        assert model.name == "Engineering"
        assert model.slug == "platform-team"
        assert model.description == "Builds core systems"

    @pytest.mark.parametrize(
        "field,value,message",
        [
            ("name", "", "Department name cannot be empty or contain only whitespace"),
            ("name", "   ", "Department name cannot be empty or contain only whitespace"),
            ("slug", "   ", "Department slug cannot be empty or contain only whitespace"),
            ("slug", "!!!", "Department slug must contain at least one letter or number"),
        ],
    )
    def test_rejects_invalid_values(self, field: str, value: str, message: str) -> None:
        payload: dict[str, object] = {"name": "Engineering"}
        payload[field] = value

        with pytest.raises(ValidationError) as exc_info:
            DepartmentCreateRequest.model_validate(payload)

        assert message in str(exc_info.value)

    def test_blank_description_becomes_none(self) -> None:
        model = DepartmentCreateRequest.model_validate({"name": "Engineering", "description": "   "})
        assert model.description is None


class TestDepartmentUpdateRequest:
    def test_allows_partial_valid_update(self) -> None:
        model = DepartmentUpdateRequest.model_validate({"name": "  Updated Name  "})
        assert model.name == "Updated Name"

    def test_rejects_whitespace_only_name(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            DepartmentUpdateRequest.model_validate({"name": "   "})

        assert "Department name cannot be empty or contain only whitespace" in str(exc_info.value)

    def test_allows_null_optional_fields(self) -> None:
        model = DepartmentUpdateRequest.model_validate({"description": None})
        assert model.description is None
        assert model.name is None


class TestTeamCreateRequest:
    def test_trims_valid_input(self) -> None:
        department_id = uuid.uuid4()
        model = TeamCreateRequest.model_validate(
            {
                "department_id": department_id,
                "name": "  Platform Team  ",
                "slug": "  Core Platform  ",
                "description": "  Builds services  ",
            }
        )
        assert model.department_id == department_id
        assert model.name == "Platform Team"
        assert model.slug == "core-platform"
        assert model.description == "Builds services"

    @pytest.mark.parametrize(
        "field,value,message",
        [
            ("name", "", "Team name cannot be empty or contain only whitespace"),
            ("name", "   ", "Team name cannot be empty or contain only whitespace"),
            ("slug", "   ", "Team slug cannot be empty or contain only whitespace"),
            ("slug", "!!!", "Team slug must contain at least one letter or number"),
        ],
    )
    def test_rejects_invalid_values(self, field: str, value: str, message: str) -> None:
        payload: dict[str, object] = {
            "department_id": uuid.uuid4(),
            "name": "Platform Team",
        }
        payload[field] = value

        with pytest.raises(ValidationError) as exc_info:
            TeamCreateRequest.model_validate(payload)

        assert message in str(exc_info.value)


class TestTeamUpdateRequest:
    def test_allows_partial_valid_update(self) -> None:
        model = TeamUpdateRequest.model_validate({"name": "  Updated Team  "})
        assert model.name == "Updated Team"

    def test_rejects_whitespace_only_name(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            TeamUpdateRequest.model_validate({"name": "   "})

        assert "Team name cannot be empty or contain only whitespace" in str(exc_info.value)


class TestPermissionCreateRequest:
    def test_trims_valid_input(self) -> None:
        model = PermissionCreateRequest.model_validate(
            {
                "name": "  Read Departments  ",
                "slug": "  departments:read  ",
                "description": "  Allows listing departments  ",
            }
        )
        assert model.name == "Read Departments"
        assert model.slug == "departments:read"
        assert model.description == "Allows listing departments"

    @pytest.mark.parametrize(
        "field,value,message",
        [
            ("name", "   ", "Permission name cannot be empty or contain only whitespace"),
            ("slug", "   ", "Permission slug cannot be empty or contain only whitespace"),
            ("slug", "invalid", "resource:action format"),
        ],
    )
    def test_rejects_invalid_values(self, field: str, value: str, message: str) -> None:
        payload: dict[str, object] = {
            "name": "Read Departments",
            "slug": "departments:read",
        }
        payload[field] = value

        with pytest.raises(ValidationError) as exc_info:
            PermissionCreateRequest.model_validate(payload)

        assert message in str(exc_info.value)


class TestPermissionUpdateRequest:
    def test_allows_partial_valid_update(self) -> None:
        model = PermissionUpdateRequest.model_validate({"slug": "  teams:write  "})
        assert model.slug == "teams:write"

