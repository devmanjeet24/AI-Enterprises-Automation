"""API validation and CRUD tests for team endpoints."""

import uuid

import pytest
from fastapi.testclient import TestClient


def _team_payload(department_id: str, **overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "department_id": department_id,
        "name": "Platform Team",
        "description": "Core platform squad",
    }
    payload.update(overrides)
    return payload


@pytest.mark.parametrize(
    "field,value,expected_message",
    [
        ("name", "", "Team name cannot be empty or contain only whitespace"),
        ("name", "   ", "Team name cannot be empty or contain only whitespace"),
        ("slug", "   ", "Team slug cannot be empty or contain only whitespace"),
        ("slug", "!!!", "Team slug must contain at least one letter or number"),
    ],
)
def test_create_team_rejects_invalid_values(
    client: TestClient,
    auth_headers: dict[str, str],
    department_id: str,
    field: str,
    value: str,
    expected_message: str,
) -> None:
    payload = _team_payload(department_id, **{field: value})
    response = client.post("/api/v1/teams", json=payload, headers=auth_headers)

    assert response.status_code == 422
    assert expected_message in response.text


def test_create_team_rejects_missing_department_id(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/teams",
        json={"name": "Platform Team"},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_create_team_rejects_unknown_department(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/teams",
        json=_team_payload(str(uuid.uuid4())),
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Department not found"


def test_create_team_trims_valid_inputs(
    client: TestClient,
    auth_headers: dict[str, str],
    department_id: str,
) -> None:
    response = client.post(
        "/api/v1/teams",
        json={
            "department_id": department_id,
            "name": "  Platform Team  ",
            "slug": "  Core Platform  ",
            "description": "  Builds shared services  ",
        },
        headers=auth_headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Platform Team"
    assert body["slug"] == "core-platform"
    assert body["description"] == "Builds shared services"
    assert body["department_id"] == department_id
    assert body["organization_id"] is not None


def test_create_team_blank_description_becomes_null(
    client: TestClient,
    auth_headers: dict[str, str],
    department_id: str,
) -> None:
    response = client.post(
        "/api/v1/teams",
        json=_team_payload(department_id, name=f"Team {uuid.uuid4().hex[:6]}", description="   "),
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert response.json()["description"] is None


def test_create_team_rejects_duplicate_slug_in_same_department(
    client: TestClient,
    auth_headers: dict[str, str],
    department_id: str,
) -> None:
    first = client.post(
        "/api/v1/teams",
        json=_team_payload(department_id, name="Alpha Team", slug="platform"),
        headers=auth_headers,
    )
    assert first.status_code == 201

    second = client.post(
        "/api/v1/teams",
        json=_team_payload(department_id, name="Beta Team", slug="platform"),
        headers=auth_headers,
    )

    assert second.status_code == 409
    assert "already taken in this department" in second.json()["detail"]


def test_list_get_update_delete_team(
    client: TestClient,
    auth_headers: dict[str, str],
    department_id: str,
) -> None:
    create_response = client.post(
        "/api/v1/teams",
        json=_team_payload(department_id, name=f"Lifecycle Team {uuid.uuid4().hex[:6]}"),
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    team_id = create_response.json()["id"]

    list_response = client.get("/api/v1/teams", headers=auth_headers)
    assert list_response.status_code == 200
    assert any(item["id"] == team_id for item in list_response.json())

    get_response = client.get(f"/api/v1/teams/{team_id}", headers=auth_headers)
    assert get_response.status_code == 200

    patch_response = client.patch(
        f"/api/v1/teams/{team_id}",
        json={"name": "  Updated Team  "},
        headers=auth_headers,
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["name"] == "Updated Team"

    delete_response = client.delete(f"/api/v1/teams/{team_id}", headers=auth_headers)
    assert delete_response.status_code == 204

    missing_response = client.get(f"/api/v1/teams/{team_id}", headers=auth_headers)
    assert missing_response.status_code == 404


def test_team_endpoints_require_authentication(client: TestClient, department_id: str) -> None:
    response = client.post(
        "/api/v1/teams",
        json=_team_payload(department_id),
    )
    assert response.status_code == 401
