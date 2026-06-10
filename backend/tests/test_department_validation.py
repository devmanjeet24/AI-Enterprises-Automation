"""API validation tests for department endpoints."""

import uuid

import pytest
from fastapi.testclient import TestClient


def _department_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Engineering",
        "description": "Product engineering department",
    }
    payload.update(overrides)
    return payload


@pytest.mark.parametrize(
    "field,value,expected_message",
    [
        ("name", "", "Department name cannot be empty or contain only whitespace"),
        ("name", "   ", "Department name cannot be empty or contain only whitespace"),
        ("slug", "   ", "Department slug cannot be empty or contain only whitespace"),
        ("slug", "!!!", "Department slug must contain at least one letter or number"),
    ],
)
def test_create_department_rejects_invalid_values(
    client: TestClient,
    auth_headers: dict[str, str],
    field: str,
    value: str,
    expected_message: str,
) -> None:
    payload = _department_payload(**{field: value})
    response = client.post("/api/v1/departments", json=payload, headers=auth_headers)

    assert response.status_code == 422
    assert expected_message in response.text


def test_create_department_rejects_null_name(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/departments",
        json={"name": None},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_create_department_trims_valid_inputs(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/departments",
        json={
            "name": "  Platform Engineering  ",
            "slug": "  Platform Team  ",
            "description": "  Core platform work  ",
        },
        headers=auth_headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Platform Engineering"
    assert body["slug"] == "platform-team"
    assert body["description"] == "Core platform work"


def test_create_department_blank_description_becomes_null(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    unique = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/departments",
        json={"name": f"Dept {unique}", "description": "   "},
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert response.json()["description"] is None


def test_update_department_rejects_whitespace_only_name(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    create_response = client.post(
        "/api/v1/departments",
        json={"name": f"Update Target {uuid.uuid4().hex[:6]}"},
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    department_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/departments/{department_id}",
        json={"name": "   "},
        headers=auth_headers,
    )

    assert response.status_code == 422
    assert "Department name cannot be empty or contain only whitespace" in response.text


def test_update_department_rejects_invalid_slug(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    create_response = client.post(
        "/api/v1/departments",
        json={"name": f"Slug Target {uuid.uuid4().hex[:6]}"},
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    department_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/departments/{department_id}",
        json={"slug": "!!!"},
        headers=auth_headers,
    )

    assert response.status_code == 422
    assert "Department slug must contain at least one letter or number" in response.text


def test_update_department_trims_valid_name(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    create_response = client.post(
        "/api/v1/departments",
        json={"name": f"Rename Target {uuid.uuid4().hex[:6]}"},
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    department_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/departments/{department_id}",
        json={"name": "  Updated Department  "},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated Department"
