"""API validation and CRUD tests for permission endpoints."""

import uuid

import pytest
from fastapi.testclient import TestClient


def _permission_payload(**overrides: object) -> dict[str, object]:
    unique = uuid.uuid4().hex[:6]
    payload: dict[str, object] = {
        "name": f"Read Departments {unique}",
        "slug": f"departments:read-{unique}",
        "description": "Allows reading departments",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
def admin_role_id(client: TestClient, auth_headers: dict[str, str]) -> str:
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    roles = response.json()["roles"]
    assert roles, "Expected registered user to have at least one role"
    return roles[0]["id"]


@pytest.mark.parametrize(
    "field,value,expected_message",
    [
        ("name", "", "Permission name cannot be empty or contain only whitespace"),
        ("name", "   ", "Permission name cannot be empty or contain only whitespace"),
        ("slug", "   ", "Permission slug cannot be empty or contain only whitespace"),
        ("slug", "invalid-slug", "resource:action format"),
    ],
)
def test_create_permission_rejects_invalid_values(
    client: TestClient,
    auth_headers: dict[str, str],
    field: str,
    value: str,
    expected_message: str,
) -> None:
    payload = _permission_payload(**{field: value})
    response = client.post("/api/v1/permissions", json=payload, headers=auth_headers)

    assert response.status_code == 422
    assert expected_message in response.text


def test_create_permission_trims_valid_slug(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    unique = uuid.uuid4().hex[:6]
    response = client.post(
        "/api/v1/permissions",
        json={
            "name": "  Read Teams  ",
            "slug": f"  teams:read-{unique}  ",
            "description": "  Read team records  ",
        },
        headers=auth_headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Read Teams"
    assert body["slug"] == f"teams:read-{unique}"
    assert body["description"] == "Read team records"


def test_permission_crud_and_role_assignment(
    client: TestClient,
    auth_headers: dict[str, str],
    admin_role_id: str,
) -> None:
    create_response = client.post(
        "/api/v1/permissions",
        json=_permission_payload(),
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    permission = create_response.json()
    permission_id = permission["id"]

    list_response = client.get("/api/v1/permissions", headers=auth_headers)
    assert list_response.status_code == 200
    assert any(item["id"] == permission_id for item in list_response.json())

    get_response = client.get(f"/api/v1/permissions/{permission_id}", headers=auth_headers)
    assert get_response.status_code == 200

    patch_response = client.patch(
        f"/api/v1/permissions/{permission_id}",
        json={"description": "Updated permission description"},
        headers=auth_headers,
    )
    assert patch_response.status_code == 200

    assign_response = client.post(
        f"/api/v1/permissions/roles/{admin_role_id}/assign",
        json={"permission_id": permission_id},
        headers=auth_headers,
    )
    assert assign_response.status_code == 201
    assert assign_response.json()["permission_slug"] == permission["slug"]

    list_assignments = client.get(
        f"/api/v1/permissions/roles/{admin_role_id}",
        headers=auth_headers,
    )
    assert list_assignments.status_code == 200
    assert any(item["permission_id"] == permission_id for item in list_assignments.json())

    duplicate_assign = client.post(
        f"/api/v1/permissions/roles/{admin_role_id}/assign",
        json={"permission_id": permission_id},
        headers=auth_headers,
    )
    assert duplicate_assign.status_code == 409

    remove_response = client.delete(
        f"/api/v1/permissions/roles/{admin_role_id}/assign/{permission_id}",
        headers=auth_headers,
    )
    assert remove_response.status_code == 204

    delete_response = client.delete(
        f"/api/v1/permissions/{permission_id}",
        headers=auth_headers,
    )
    assert delete_response.status_code == 204


def test_permission_endpoints_require_authentication(client: TestClient) -> None:
    response = client.post(
        "/api/v1/permissions",
        json=_permission_payload(),
    )
    assert response.status_code == 401
