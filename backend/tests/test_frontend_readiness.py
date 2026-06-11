"""Tests for frontend-readiness endpoints: CORS, auth, org, dashboard."""

import uuid

import pytest
from fastapi.testclient import TestClient


def _register_admin(client: TestClient) -> tuple[dict[str, str], dict[str, object]]:
    unique = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"frontend.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Frontend",
            "last_name": "Admin",
            "organization_name": f"Frontend Org {unique}",
        },
    )
    assert response.status_code == 201, response.text
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return headers, response.json()


def test_cors_allows_configured_origin(client: TestClient) -> None:
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_login_json_returns_token(client: TestClient) -> None:
    unique = uuid.uuid4().hex[:8]
    email = f"json.login.{unique}@example.com"
    password = "securepass123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "first_name": "Json",
            "last_name": "Login",
            "organization_name": f"Json Org {unique}",
        },
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login/json",
        json={"email": email, "password": password},
    )

    assert login_response.status_code == 200
    body = login_response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_auth_me_includes_permissions(client: TestClient) -> None:
    headers, _ = _register_admin(client)

    response = client.get("/api/v1/auth/me", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["permissions"], list)
    assert len(body["permissions"]) > 0
    assert "users:read" in body["permissions"]
    assert body["roles"][0]["slug"] == "admin"


def test_get_organization_me(client: TestClient) -> None:
    headers, _ = _register_admin(client)

    response = client.get("/api/v1/organizations/me", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["name"].startswith("Frontend Org")
    assert body["is_active"] is True
    assert "slug" in body


def test_patch_organization_me_requires_admin(client: TestClient) -> None:
    unique = uuid.uuid4().hex[:8]
    org_slug = f"member-org-{unique}"

    admin_headers, _ = _register_admin(client)
    org_response = client.get("/api/v1/organizations/me", headers=admin_headers)
    org_slug = org_response.json()["slug"]

    member_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"member.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Member",
            "last_name": "User",
            "organization_slug": org_slug,
        },
    )
    assert member_response.status_code == 201
    member_headers = {"Authorization": f"Bearer {member_response.json()['access_token']}"}

    forbidden = client.patch(
        "/api/v1/organizations/me",
        json={"description": "Should fail"},
        headers=member_headers,
    )
    assert forbidden.status_code == 403

    allowed = client.patch(
        "/api/v1/organizations/me",
        json={"description": "Updated organization description"},
        headers=admin_headers,
    )
    assert allowed.status_code == 200
    assert allowed.json()["description"] == "Updated organization description"


def test_dashboard_overview_returns_counts(client: TestClient) -> None:
    headers, _ = _register_admin(client)

    client.post(
        "/api/v1/departments",
        json={"name": f"Dashboard Dept {uuid.uuid4().hex[:6]}"},
        headers=headers,
    )

    response = client.get("/api/v1/dashboard/overview", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_users"] >= 1
    assert body["total_departments"] >= 1
    assert body["total_teams"] == 0
    assert body["total_documents"] == 0
    assert body["total_ai_employees"] == 0
    assert body["total_agent_tasks"] == 0
    assert body["total_workflows"] == 0
    assert body["total_research_projects"] == 0
    assert body["total_browser_tasks"] == 0
