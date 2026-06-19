"""API tests for user and role management endpoints."""

import uuid
from urllib.parse import parse_qs, urlparse

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
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _set_user_role(email: str, role_slug: str) -> None:
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        assert user is not None

        role = db.scalar(
            select(Role).where(
                Role.organization_id == user.organization_id,
                Role.slug == role_slug,
            )
        )
        assert role is not None

        db.execute(delete(UserRole).where(UserRole.user_id == user.id))
        db.add(UserRole(user_id=user.id, role_id=role.id))
        db.commit()


@pytest.fixture
def org_users(client: TestClient) -> dict:
    """One organization with admin, manager, and member accounts."""
    unique = uuid.uuid4().hex[:8]
    org_name = f"User Mgmt Org {unique}"

    admin_email = f"admin.{unique}@example.com"
    manager_email = f"manager.{unique}@example.com"
    member_email = f"member.{unique}@example.com"

    admin_headers = _register_user(client, email=admin_email, organization_name=org_name)
    org_slug = client.get("/api/v1/auth/me", headers=admin_headers).json()["organization_slug"]

    manager_headers = _register_user(client, email=manager_email, organization_slug=org_slug)
    member_headers = _register_user(client, email=member_email, organization_slug=org_slug)
    _set_user_role(manager_email, "manager")

    admin_me = client.get("/api/v1/auth/me", headers=admin_headers).json()
    member_me = client.get("/api/v1/auth/me", headers=member_headers).json()

    return {
        "unique": unique,
        "admin": admin_headers,
        "manager": manager_headers,
        "member": member_headers,
        "admin_user_id": admin_me["id"],
        "member_user_id": member_me["id"],
        "member_email": member_email,
    }


def test_admin_can_list_and_get_users(client: TestClient, org_users: dict) -> None:
    list_response = client.get("/api/v1/users", headers=org_users["admin"])
    assert list_response.status_code == 200
    assert len(list_response.json()) >= 3

    get_response = client.get(
        f"/api/v1/users/{org_users['member_user_id']}",
        headers=org_users["admin"],
    )
    assert get_response.status_code == 200
    assert get_response.json()["email"] == org_users["member_email"]


def test_admin_can_update_user(client: TestClient, org_users: dict) -> None:
    response = client.patch(
        f"/api/v1/users/{org_users['member_user_id']}",
        json={"first_name": "Updated", "last_name": "Member"},
        headers=org_users["admin"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["first_name"] == "Updated"
    assert body["last_name"] == "Member"


def test_admin_can_create_user(client: TestClient, org_users: dict) -> None:
    unique = org_users["unique"]
    response = client.post(
        "/api/v1/users",
        json={
            "email": f"created.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Created",
            "last_name": "User",
        },
        headers=org_users["admin"],
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["email"] == f"created.{unique}@example.com"
    assert body["is_active"] is True
    assert body["roles"][0]["slug"] == "member"

    login_response = client.post(
        "/api/v1/auth/login/json",
        json={"email": f"created.{unique}@example.com", "password": "securepass123"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["access_token"]


def test_admin_can_invite_resend_and_user_accepts(client: TestClient, org_users: dict) -> None:
    unique = org_users["unique"]
    email = f"invited.{unique}@example.com"

    invite_response = client.post(
        "/api/v1/users/invitations",
        json={
            "email": email,
            "first_name": "Invited",
            "last_name": "User",
        },
        headers=org_users["admin"],
    )
    assert invite_response.status_code == 201, invite_response.text
    invite = invite_response.json()
    assert invite["email"] == email
    assert invite["accepted_at"] is None
    assert invite["invite_url"]

    list_response = client.get("/api/v1/users/invitations", headers=org_users["admin"])
    assert list_response.status_code == 200
    assert any(item["id"] == invite["id"] for item in list_response.json())

    resend_response = client.post(
        f"/api/v1/users/invitations/{invite['id']}/resend",
        headers=org_users["admin"],
    )
    assert resend_response.status_code == 200, resend_response.text
    token = parse_qs(urlparse(resend_response.json()["invite_url"]).query)["token"][0]

    accept_response = client.post(
        "/api/v1/users/invitations/accept",
        json={"token": token, "password": "securepass123"},
    )
    assert accept_response.status_code == 200, accept_response.text
    invited_headers = {"Authorization": f"Bearer {accept_response.json()['access_token']}"}

    invited_me = client.get("/api/v1/auth/me", headers=invited_headers).json()
    admin_me = client.get("/api/v1/auth/me", headers=org_users["admin"]).json()
    assert invited_me["email"] == email
    assert invited_me["organization_id"] == admin_me["organization_id"]
    assert invited_me["roles"][0]["slug"] == "member"

    invitations = client.get("/api/v1/users/invitations", headers=org_users["admin"]).json()
    accepted_invitation = next(item for item in invitations if item["id"] == invite["id"])
    assert accepted_invitation["accepted_at"] is not None


def test_admin_can_deactivate_user(client: TestClient, org_users: dict) -> None:
    response = client.patch(
        f"/api/v1/users/{org_users['member_user_id']}",
        json={"is_active": False},
        headers=org_users["admin"],
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_admin_cannot_deactivate_self(client: TestClient, org_users: dict) -> None:
    response = client.patch(
        f"/api/v1/users/{org_users['admin_user_id']}",
        json={"is_active": False},
        headers=org_users["admin"],
    )
    assert response.status_code == 400
    assert "cannot deactivate your own account" in response.text.lower()


def test_admin_can_create_and_delete_custom_role(client: TestClient, org_users: dict) -> None:
    unique = org_users["unique"]
    create_response = client.post(
        "/api/v1/roles",
        json={"name": f"Support Lead {unique}", "description": "Handles support queue"},
        headers=org_users["admin"],
    )
    assert create_response.status_code == 201
    role = create_response.json()
    assert role["slug"].startswith("support-lead-")

    get_response = client.get(f"/api/v1/roles/{role['id']}", headers=org_users["admin"])
    assert get_response.status_code == 200
    assert get_response.json()["permissions"] == []

    delete_response = client.delete(f"/api/v1/roles/{role['id']}", headers=org_users["admin"])
    assert delete_response.status_code == 204


def test_admin_cannot_delete_system_role(client: TestClient, org_users: dict) -> None:
    roles_response = client.get("/api/v1/roles", headers=org_users["admin"])
    admin_role = next(role for role in roles_response.json() if role["slug"] == "admin")

    response = client.delete(f"/api/v1/roles/{admin_role['id']}", headers=org_users["admin"])
    assert response.status_code == 400
    assert "system roles cannot be deleted" in response.text.lower()


def test_admin_can_assign_and_remove_role(client: TestClient, org_users: dict) -> None:
    unique = org_users["unique"]
    role_response = client.post(
        "/api/v1/roles",
        json={"name": f"Reviewer {unique}"},
        headers=org_users["admin"],
    )
    assert role_response.status_code == 201
    role_id = role_response.json()["id"]

    assign_response = client.post(
        f"/api/v1/users/{org_users['member_user_id']}/roles",
        json={"role_id": role_id},
        headers=org_users["admin"],
    )
    assert assign_response.status_code == 201
    assert assign_response.json()["role_slug"] == role_response.json()["slug"]

    remove_response = client.delete(
        f"/api/v1/users/{org_users['member_user_id']}/roles/{role_id}",
        headers=org_users["admin"],
    )
    assert remove_response.status_code == 204

    client.delete(f"/api/v1/roles/{role_id}", headers=org_users["admin"])


def test_manager_can_read_users_and_roles_but_not_write(client: TestClient, org_users: dict) -> None:
    assert client.get("/api/v1/users", headers=org_users["manager"]).status_code == 200
    assert client.get("/api/v1/roles", headers=org_users["manager"]).status_code == 200

    update_response = client.patch(
        f"/api/v1/users/{org_users['member_user_id']}",
        json={"first_name": "Blocked"},
        headers=org_users["manager"],
    )
    assert update_response.status_code == 403
    assert "users:write" in update_response.text

    create_role_response = client.post(
        "/api/v1/roles",
        json={"name": "Blocked Role"},
        headers=org_users["manager"],
    )
    assert create_role_response.status_code == 403
    assert "roles:write" in create_role_response.text


def test_member_cannot_access_user_management(client: TestClient, org_users: dict) -> None:
    list_response = client.get("/api/v1/users", headers=org_users["member"])
    assert list_response.status_code == 403
    assert "users:read" in list_response.text

    roles_response = client.get("/api/v1/roles", headers=org_users["member"])
    assert roles_response.status_code == 403
    assert "roles:read" in roles_response.text


def test_user_and_role_endpoints_require_authentication(client: TestClient) -> None:
    assert client.get("/api/v1/users").status_code == 401
    assert client.get("/api/v1/roles").status_code == 401
