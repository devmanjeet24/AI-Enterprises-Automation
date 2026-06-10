"""Authorization tests: admin, manager, and member permission enforcement."""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.db.session import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole


def _register_user(
    client: TestClient,
    *,
    email: str,
    organization_name: str | None = None,
    organization_slug: str | None = None,
) -> dict[str, str]:
    payload: dict[str, str] = {
        "email": email,
        "password": "securepass123",
        "first_name": "Test",
        "last_name": "User",
    }
    if organization_name is not None:
        payload["organization_name"] = organization_name
    if organization_slug is not None:
        payload["organization_slug"] = organization_slug

    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _set_user_role(email: str, role_slug: str) -> None:
    """Replace a user's role assignments in the database (test helper)."""
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        assert user is not None, f"User {email} not found"

        role = db.scalar(
            select(Role).where(
                Role.organization_id == user.organization_id,
                Role.slug == role_slug,
            )
        )
        assert role is not None, f"Role {role_slug} not found for user's organization"

        db.execute(delete(UserRole).where(UserRole.user_id == user.id))
        db.add(UserRole(user_id=user.id, role_id=role.id))
        db.commit()


@pytest.fixture
def role_headers(client: TestClient) -> dict[str, dict[str, str]]:
    """Create one organization with admin, manager, and member users."""
    unique = uuid.uuid4().hex[:8]
    org_name = f"Auth Org {unique}"

    admin_email = f"admin.{unique}@example.com"
    manager_email = f"manager.{unique}@example.com"
    member_email = f"member.{unique}@example.com"

    admin_headers = _register_user(
        client,
        email=admin_email,
        organization_name=org_name,
    )

    me_response = client.get("/api/v1/auth/me", headers=admin_headers)
    assert me_response.status_code == 200
    org_slug = me_response.json()["organization_slug"]

    manager_headers = _register_user(
        client,
        email=manager_email,
        organization_slug=org_slug,
    )
    member_headers = _register_user(
        client,
        email=member_email,
        organization_slug=org_slug,
    )

    _set_user_role(manager_email, "manager")

    return {
        "admin": admin_headers,
        "manager": manager_headers,
        "member": member_headers,
        "unique": unique,
    }


@pytest.fixture
def admin_department_id(client: TestClient, role_headers: dict) -> str:
    """Department created by admin for reuse in authorization tests."""
    unique = role_headers["unique"]
    response = client.post(
        "/api/v1/departments",
        json={"name": f"Engineering {unique}"},
        headers=role_headers["admin"],
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


# --- Admin: full access ---


def test_admin_can_create_department(client: TestClient, role_headers: dict) -> None:
    response = client.post(
        "/api/v1/departments",
        json={"name": f"Admin Dept {role_headers['unique']}"},
        headers=role_headers["admin"],
    )
    assert response.status_code == 201


def test_admin_can_manage_permissions(client: TestClient, role_headers: dict) -> None:
    unique = role_headers["unique"]
    response = client.post(
        "/api/v1/permissions",
        json={
            "name": f"Custom Permission {unique}",
            "slug": f"custom:action-{unique}",
            "description": "Admin-only custom permission",
        },
        headers=role_headers["admin"],
    )
    assert response.status_code == 201


def test_admin_can_list_permissions(client: TestClient, role_headers: dict) -> None:
    response = client.get("/api/v1/permissions", headers=role_headers["admin"])
    assert response.status_code == 200
    slugs = {item["slug"] for item in response.json()}
    assert "departments:read" in slugs
    assert "permissions:write" in slugs


# --- Manager: org structure yes, permission admin no ---


def test_manager_can_create_department(client: TestClient, role_headers: dict) -> None:
    response = client.post(
        "/api/v1/departments",
        json={"name": f"Manager Dept {role_headers['unique']}"},
        headers=role_headers["manager"],
    )
    assert response.status_code == 201


def test_manager_can_list_permissions(client: TestClient, role_headers: dict) -> None:
    response = client.get("/api/v1/permissions", headers=role_headers["manager"])
    assert response.status_code == 200


def test_manager_cannot_create_permission(client: TestClient, role_headers: dict) -> None:
    unique = role_headers["unique"]
    response = client.post(
        "/api/v1/permissions",
        json={
            "name": f"Blocked Permission {unique}",
            "slug": f"blocked:action-{unique}",
        },
        headers=role_headers["manager"],
    )
    assert response.status_code == 403
    assert "permissions:write" in response.text


def test_manager_can_delete_department(
    client: TestClient,
    role_headers: dict,
    admin_department_id: str,
) -> None:
    response = client.delete(
        f"/api/v1/departments/{admin_department_id}",
        headers=role_headers["manager"],
    )
    assert response.status_code == 204


def test_manager_can_create_team(
    client: TestClient,
    role_headers: dict,
    admin_department_id: str,
) -> None:
    response = client.post(
        "/api/v1/teams",
        json={
            "name": f"Manager Team {role_headers['unique']}",
            "department_id": admin_department_id,
        },
        headers=role_headers["manager"],
    )
    assert response.status_code == 201


# --- Member: read-only ---


def test_member_can_list_departments(client: TestClient, role_headers: dict) -> None:
    response = client.get("/api/v1/departments", headers=role_headers["member"])
    assert response.status_code == 200


def test_member_can_list_teams(client: TestClient, role_headers: dict) -> None:
    response = client.get("/api/v1/teams", headers=role_headers["member"])
    assert response.status_code == 200


def test_member_cannot_create_department(client: TestClient, role_headers: dict) -> None:
    response = client.post(
        "/api/v1/departments",
        json={"name": f"Member Dept {role_headers['unique']}"},
        headers=role_headers["member"],
    )
    assert response.status_code == 403
    assert "departments:write" in response.text


def test_member_cannot_update_department(
    client: TestClient,
    role_headers: dict,
    admin_department_id: str,
) -> None:
    response = client.patch(
        f"/api/v1/departments/{admin_department_id}",
        json={"description": "Member tried to update"},
        headers=role_headers["member"],
    )
    assert response.status_code == 403
    assert "departments:write" in response.text


def test_member_cannot_delete_department(
    client: TestClient,
    role_headers: dict,
    admin_department_id: str,
) -> None:
    response = client.delete(
        f"/api/v1/departments/{admin_department_id}",
        headers=role_headers["member"],
    )
    assert response.status_code == 403
    assert "departments:delete" in response.text


def test_member_cannot_list_permissions(client: TestClient, role_headers: dict) -> None:
    response = client.get("/api/v1/permissions", headers=role_headers["member"])
    assert response.status_code == 403
    assert "permissions:read" in response.text


def test_member_cannot_create_team(
    client: TestClient,
    role_headers: dict,
    admin_department_id: str,
) -> None:
    response = client.post(
        "/api/v1/teams",
        json={
            "name": f"Member Team {role_headers['unique']}",
            "department_id": admin_department_id,
        },
        headers=role_headers["member"],
    )
    assert response.status_code == 403
    assert "teams:write" in response.text


def test_new_organization_seeds_default_permissions(
    client: TestClient,
    role_headers: dict,
) -> None:
    """Confirm register-time seeding created the standard permission catalog."""
    response = client.get("/api/v1/permissions", headers=role_headers["admin"])
    assert response.status_code == 200
    slugs = {item["slug"] for item in response.json()}
    expected = {
        "departments:read",
        "departments:write",
        "departments:delete",
        "teams:read",
        "teams:write",
        "teams:delete",
        "permissions:read",
        "permissions:write",
        "permissions:delete",
        "permissions:assign",
        "users:read",
        "users:write",
        "users:assign-role",
        "roles:read",
        "roles:write",
        "roles:delete",
    }
    assert expected.issubset(slugs)
