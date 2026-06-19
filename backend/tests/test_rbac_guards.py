"""RBAC guard tests: system role protection, org permissions, role assignment."""

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
def rbac_org(client: TestClient) -> dict:
    unique = uuid.uuid4().hex[:8]
    org_name = f"RBAC Guard Org {unique}"

    admin_email = f"admin.{unique}@example.com"
    manager_email = f"manager.{unique}@example.com"
    member_email = f"member.{unique}@example.com"

    admin_headers = _register_user(client, email=admin_email, organization_name=org_name)
    org_slug = client.get("/api/v1/auth/me", headers=admin_headers).json()["organization_slug"]

    manager_headers = _register_user(client, email=manager_email, organization_slug=org_slug)
    member_headers = _register_user(client, email=member_email, organization_slug=org_slug)
    _set_user_role(manager_email, "manager")

    admin_me = client.get("/api/v1/auth/me", headers=admin_headers).json()
    manager_me = client.get("/api/v1/auth/me", headers=manager_headers).json()
    member_me = client.get("/api/v1/auth/me", headers=member_headers).json()

    roles = client.get("/api/v1/roles", headers=admin_headers).json()
    admin_role = next(role for role in roles if role["slug"] == "admin")
    manager_role = next(role for role in roles if role["slug"] == "manager")

    permissions = client.get("/api/v1/permissions", headers=admin_headers).json()
    departments_read = next(item for item in permissions if item["slug"] == "departments:read")
    organizations_write = next(item for item in permissions if item["slug"] == "organizations:write")

    return {
        "unique": unique,
        "admin": admin_headers,
        "manager": manager_headers,
        "member": member_headers,
        "admin_role_id": admin_role["id"],
        "manager_role_id": manager_role["id"],
        "departments_read_id": departments_read["id"],
        "organizations_write_id": organizations_write["id"],
        "member_user_id": member_me["id"],
        "admin_permissions": admin_me["permissions"],
        "manager_permissions": manager_me["permissions"],
    }


def test_admin_has_organization_permissions(rbac_org: dict) -> None:
    assert "organizations:read" in rbac_org["admin_permissions"]
    assert "organizations:write" in rbac_org["admin_permissions"]


def test_manager_can_read_org_but_not_write(client: TestClient, rbac_org: dict) -> None:
    assert "organizations:read" in rbac_org["manager_permissions"]
    assert "organizations:write" not in rbac_org["manager_permissions"]

    assert client.get("/api/v1/organizations/me", headers=rbac_org["manager"]).status_code == 200

    patch_response = client.patch(
        "/api/v1/organizations/me",
        json={"description": "Manager should be blocked"},
        headers=rbac_org["manager"],
    )
    assert patch_response.status_code == 403
    assert "organizations:write" in patch_response.text


def test_member_can_access_dashboard_overview(client: TestClient, rbac_org: dict) -> None:
    response = client.get("/api/v1/dashboard/overview", headers=rbac_org["member"])
    assert response.status_code == 200


def test_cannot_revoke_default_permission_from_system_role(
    client: TestClient,
    rbac_org: dict,
) -> None:
    response = client.delete(
        f"/api/v1/permissions/roles/{rbac_org['admin_role_id']}"
        f"/assign/{rbac_org['departments_read_id']}",
        headers=rbac_org["admin"],
    )
    assert response.status_code == 400
    assert "cannot revoke default permission" in response.text.lower()


def test_can_revoke_custom_permission_from_system_role(
    client: TestClient,
    rbac_org: dict,
) -> None:
    unique = rbac_org["unique"]
    create_response = client.post(
        "/api/v1/permissions",
        json={
            "name": f"Custom {unique}",
            "slug": f"custom:extra-{unique}",
        },
        headers=rbac_org["admin"],
    )
    assert create_response.status_code == 201
    permission_id = create_response.json()["id"]

    assign_response = client.post(
        f"/api/v1/permissions/roles/{rbac_org['admin_role_id']}/assign",
        json={"permission_id": permission_id},
        headers=rbac_org["admin"],
    )
    assert assign_response.status_code == 201

    remove_response = client.delete(
        f"/api/v1/permissions/roles/{rbac_org['admin_role_id']}/assign/{permission_id}",
        headers=rbac_org["admin"],
    )
    assert remove_response.status_code == 204

    client.delete(f"/api/v1/permissions/{permission_id}", headers=rbac_org["admin"])


def test_cannot_delete_builtin_permission(client: TestClient, rbac_org: dict) -> None:
    response = client.delete(
        f"/api/v1/permissions/{rbac_org['departments_read_id']}",
        headers=rbac_org["admin"],
    )
    assert response.status_code == 400
    assert "cannot delete built-in permission" in response.text.lower()


def test_admin_can_create_unlimited_custom_roles(client: TestClient, rbac_org: dict) -> None:
    unique = rbac_org["unique"]
    role_ids: list[str] = []

    for index in range(3):
        response = client.post(
            "/api/v1/roles",
            json={"name": f"Custom Role {unique} {index}"},
            headers=rbac_org["admin"],
        )
        assert response.status_code == 201, response.text
        role_ids.append(response.json()["id"])

    for role_id in role_ids:
        client.delete(f"/api/v1/roles/{role_id}", headers=rbac_org["admin"])


def test_create_user_with_explicit_role_requires_assign_role_permission(
    client: TestClient,
    rbac_org: dict,
) -> None:
    unique = rbac_org["unique"]

    role_response = client.post(
        "/api/v1/roles",
        json={"name": f"User Creator {unique}"},
        headers=rbac_org["admin"],
    )
    assert role_response.status_code == 201
    custom_role_id = role_response.json()["id"]

    permissions = client.get("/api/v1/permissions", headers=rbac_org["admin"]).json()
    users_write = next(item for item in permissions if item["slug"] == "users:write")

    assign_response = client.post(
        f"/api/v1/permissions/roles/{custom_role_id}/assign",
        json={"permission_id": users_write["id"]},
        headers=rbac_org["admin"],
    )
    assert assign_response.status_code == 201

    creator_email = f"creator.{unique}@example.com"
    creator_register = client.post(
        "/api/v1/auth/register",
        json={
            "email": creator_email,
            "password": "securepass123",
            "first_name": "Creator",
            "last_name": "Only",
            "organization_slug": client.get("/api/v1/auth/me", headers=rbac_org["admin"]).json()["organization_slug"],
        },
    )
    assert creator_register.status_code == 201
    creator_user_id = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {creator_register.json()['access_token']}"},
    ).json()["id"]

    assign_user_role = client.post(
        f"/api/v1/users/{creator_user_id}/roles",
        json={"role_id": custom_role_id},
        headers=rbac_org["admin"],
    )
    assert assign_user_role.status_code == 201

    creator_headers = {"Authorization": f"Bearer {creator_register.json()['access_token']}"}
    response = client.post(
        "/api/v1/users",
        json={
            "email": f"blocked.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Blocked",
            "last_name": "Role",
            "role_id": rbac_org["manager_role_id"],
        },
        headers=creator_headers,
    )
    assert response.status_code == 403
    assert "users:assign-role" in response.text

    client.delete(
        f"/api/v1/users/{creator_user_id}/roles/{custom_role_id}",
        headers=rbac_org["admin"],
    )
    client.delete(f"/api/v1/roles/{custom_role_id}", headers=rbac_org["admin"])


def test_create_user_with_default_member_role_does_not_require_assign_role(
    client: TestClient,
    rbac_org: dict,
) -> None:
    unique = rbac_org["unique"]
    response = client.post(
        "/api/v1/users",
        json={
            "email": f"default.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Default",
            "last_name": "Member",
        },
        headers=rbac_org["admin"],
    )
    assert response.status_code == 201, response.text
    assert response.json()["roles"][0]["slug"] == "member"
