"""API validation tests for authentication endpoints."""

import uuid

import pytest
from fastapi.testclient import TestClient


def _register_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "email": "valid.user@example.com",
        "password": "securepass123",
        "first_name": "Valid",
        "last_name": "User",
        "organization_name": "Valid Org",
    }
    payload.update(overrides)
    return payload


@pytest.mark.parametrize(
    "field,value,expected_message",
    [
        ("password", "          ", "Password cannot be empty or contain only whitespace"),
        ("first_name", "   ", "First name cannot be empty or contain only whitespace"),
        ("last_name", "   ", "Last name cannot be empty or contain only whitespace"),
        ("organization_name", "   ", "Organization name cannot be empty or contain only whitespace"),
        ("email", "   ", "Email cannot be empty or contain only whitespace"),
    ],
)
def test_register_rejects_whitespace_only_fields(
    client: TestClient,
    field: str,
    value: str,
    expected_message: str,
) -> None:
    payload = _register_payload(**{field: value})
    response = client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 422
    assert expected_message in response.text


@pytest.mark.parametrize(
    "field,value",
    [
        ("email", None),
        ("password", None),
        ("first_name", None),
        ("last_name", None),
    ],
)
def test_register_rejects_null_required_fields(
    client: TestClient,
    field: str,
    value: None,
) -> None:
    payload = _register_payload(**{field: value})
    response = client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 422


def test_register_rejects_empty_string_required_fields(client: TestClient) -> None:
    payload = _register_payload(email="", password="", first_name="", last_name="")
    response = client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 422
    assert "cannot be empty or contain only whitespace" in response.text


def test_register_trims_valid_inputs_before_persisting(client: TestClient) -> None:
    unique = uuid.uuid4().hex[:8]
    payload = _register_payload(
        email=f"  trimmed.{unique}@example.com  ",
        password="  securepass123  ",
        first_name="  Manjeet  ",
        last_name="  Singh  ",
        organization_name=f"  Trimmed Org {unique}  ",
    )
    response = client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 201

    token = response.json()["access_token"]
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert me_response.status_code == 200
    body = me_response.json()
    assert body["email"] == f"trimmed.{unique}@example.com"
    assert body["first_name"] == "Manjeet"
    assert body["last_name"] == "Singh"
    assert body["organization_name"] == f"Trimmed Org {unique}"
    assert body["organization_slug"] == f"trimmed-org-{unique}"


def test_register_rejects_original_whitespace_only_payload(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user1@example.com",
            "password": "          ",
            "first_name": "111111",
            "last_name": "       1",
            "organization_name": "        ",
        },
    )

    assert response.status_code == 422
    assert "cannot be empty or contain only whitespace" in response.text


def test_login_rejects_whitespace_only_credentials(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "   ", "password": "          "},
    )

    assert response.status_code == 422
    assert "cannot be empty or contain only whitespace" in response.text


def test_login_rejects_whitespace_only_password(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "user@example.com", "password": "          "},
    )

    assert response.status_code == 422
    assert "Password cannot be empty or contain only whitespace" in response.text
